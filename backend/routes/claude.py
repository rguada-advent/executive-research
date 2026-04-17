"""
Flask blueprint that proxies AI API calls server-side.
Supports Anthropic Claude, OpenAI GPT, and Google Gemini.

API keys live only in the backend (psg_config.json) — never in the browser.
Provider is auto-detected from the model name:
  claude-*  → Anthropic  (https://api.anthropic.com/v1/messages)
  gpt-*, o* → OpenAI     (https://api.openai.com/v1/chat/completions)
  gemini-*  → Google     (https://generativelanguage.googleapis.com/v1beta/openai/…)

OpenAI and Gemini responses are normalized to Anthropic format so the
frontend streaming/parsing code requires no changes.
"""
from flask import Blueprint, request, jsonify, Response, stream_with_context
import re
import json as _json
import requests as http_requests
from services.claude_config import get_api_key, save_api_key, get_provider_status

claude_bp = Blueprint("claude", __name__, url_prefix="/claude")

# ── Provider endpoints ────────────────────────────────────────────────────────
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OPENAI_URL    = "https://api.openai.com/v1/chat/completions"
# Google exposes an OpenAI-compatible endpoint — same message format, same auth header
GEMINI_URL    = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"

# ── Validation patterns ───────────────────────────────────────────────────────
_ANTHROPIC_KEY_RE = re.compile(r'^sk-ant-[A-Za-z0-9_\-]+$')
_OPENAI_KEY_RE    = re.compile(r'^sk-[A-Za-z0-9_\-]+$')
_GEMINI_KEY_RE    = re.compile(r'^AIza[A-Za-z0-9_\-]+$')

_API_KEY_MIN_LEN = 20
_API_KEY_MAX_LEN = 300

# Per-message content truncation limit (characters)
_MAX_CONTENT_CHARS = 50_000

# ── Provider detection ────────────────────────────────────────────────────────

def _get_provider(model: str) -> str:
    """Auto-detect the AI provider from the model name."""
    m = model.lower()
    if m.startswith(('gpt-', 'o1', 'o3', 'o4', 'ft:gpt')):
        return 'openai'
    if m.startswith('gemini-'):
        return 'gemini'
    return 'anthropic'  # default — covers all claude-* models


# ── Key validation ────────────────────────────────────────────────────────────

def _validate_api_key_format(key: str, provider: str = 'anthropic') -> str | None:
    """Return an error string if the key is malformed, else None."""
    if len(key) < _API_KEY_MIN_LEN or len(key) > _API_KEY_MAX_LEN:
        return f"Key length out of range ({_API_KEY_MIN_LEN}–{_API_KEY_MAX_LEN} chars expected)"
    if provider == 'anthropic':
        if not _ANTHROPIC_KEY_RE.match(key):
            return "Invalid Anthropic key — must start with sk-ant-"
    elif provider == 'openai':
        if not _OPENAI_KEY_RE.match(key):
            return "Invalid OpenAI key — must start with sk-"
    elif provider == 'gemini':
        if not _GEMINI_KEY_RE.match(key):
            return "Invalid Gemini key — must start with AIza"
    return None


# ── Message sanitization ──────────────────────────────────────────────────────

def _sanitize_messages(messages: list) -> tuple[list, list]:
    """
    Validate structure and truncate oversized content blocks.
    Returns (sanitized_messages, warnings). Raises ValueError on hard failures.
    """
    if not isinstance(messages, list):
        raise ValueError("'messages' must be an array")

    warnings, sanitized = [], []
    for idx, msg in enumerate(messages):
        if not isinstance(msg, dict):
            raise ValueError(f"Message at index {idx} must be an object")
        if "role" not in msg or "content" not in msg:
            raise ValueError(f"Message at index {idx} must have 'role' and 'content' fields")

        content = msg["content"]
        if isinstance(content, str):
            if len(content) > _MAX_CONTENT_CHARS:
                warnings.append(f"Message {idx} truncated from {len(content)} to {_MAX_CONTENT_CHARS} chars")
                content = content[:_MAX_CONTENT_CHARS]
            sanitized.append({**msg, "content": content})
        elif isinstance(content, list):
            sanitized_blocks = []
            for bidx, block in enumerate(content):
                if isinstance(block, dict) and isinstance(block.get("text"), str):
                    text = block["text"]
                    if len(text) > _MAX_CONTENT_CHARS:
                        warnings.append(f"Message {idx} block {bidx} truncated")
                        block = {**block, "text": text[:_MAX_CONTENT_CHARS]}
                sanitized_blocks.append(block)
            sanitized.append({**msg, "content": sanitized_blocks})
        else:
            sanitized.append(msg)

    return sanitized, warnings


# ── OpenAI/Gemini format helpers ──────────────────────────────────────────────

def _to_openai_messages(body: dict) -> list:
    """
    Convert an Anthropic-style body to the OpenAI messages array.
    Anthropic separates 'system' from 'messages'; OpenAI prepends it.
    """
    msgs = list(body.get("messages", []))
    system = body.get("system", "")
    if system:
        msgs = [{"role": "system", "content": system}] + msgs
    return msgs


def _build_openai_body(body: dict) -> dict:
    """Translate an Anthropic-style request body into OpenAI chat-completions format."""
    return {
        "model":      body.get("model"),
        "messages":   _to_openai_messages(body),
        "max_tokens": body.get("max_tokens", 16384),
        "stream":     body.get("stream", False),
        "temperature": body.get("temperature", 1),
    }


def _normalize_openai_response(resp_json: dict) -> dict:
    """Convert an OpenAI non-streaming response to Anthropic message format."""
    text = ""
    choices = resp_json.get("choices", [])
    if choices:
        text = choices[0].get("message", {}).get("content", "") or ""
    usage = resp_json.get("usage", {})
    return {
        "id":           resp_json.get("id", ""),
        "type":         "message",
        "role":         "assistant",
        "content":      [{"type": "text", "text": text}],
        "model":        resp_json.get("model", ""),
        "stop_reason":  "end_turn",
        "usage": {
            "input_tokens":  usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
        },
    }


def _openai_stream_to_anthropic(resp):
    """
    Normalize an OpenAI/Gemini SSE stream to Anthropic SSE format so the
    existing frontend streamResponse() parser requires no changes.
    """
    # Signal the start of a text block
    yield f"data: {_json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n".encode()

    for line in resp.iter_lines():
        if not line:
            continue
        if isinstance(line, bytes):
            line = line.decode("utf-8")
        if not line.startswith("data: "):
            continue
        raw = line[6:].strip()
        if raw == "[DONE]":
            break
        try:
            d = _json.loads(raw)
        except Exception:
            continue

        choices = d.get("choices", [])
        if not choices:
            continue
        delta = choices[0].get("delta", {})
        content = delta.get("content")
        if content:
            yield f"data: {_json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': content}})}\n\n".encode()

    yield f"data: {_json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n".encode()
    yield f"data: {_json.dumps({'type': 'message_stop'})}\n\n".encode()


# ── Provider call helpers ─────────────────────────────────────────────────────

def _call_anthropic(body: dict, api_key: str, is_stream: bool, req_headers):
    upstream_headers = {
        "Content-Type":      "application/json",
        "x-api-key":         api_key,
        "anthropic-version": "2023-06-01",
    }
    # Forward beta feature flags (e.g. web search)
    if "anthropic-beta" in req_headers:
        upstream_headers["anthropic-beta"] = req_headers["anthropic-beta"]

    if is_stream:
        def generate():
            try:
                with http_requests.post(
                    ANTHROPIC_URL, headers=upstream_headers,
                    json=body, stream=True, timeout=300,
                ) as resp:
                    for chunk in resp.iter_content(chunk_size=None):
                        if chunk:
                            yield chunk
            except Exception as e:
                yield f"data: {_json.dumps({'type': 'error', 'error': {'message': str(e)}})}\n\n".encode()

        return Response(
            stream_with_context(generate()), status=200,
            content_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    else:
        resp = http_requests.post(ANTHROPIC_URL, headers=upstream_headers, json=body, timeout=120)
        return Response(
            resp.content, status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "application/json"),
        )


def _call_openai_compat(body: dict, api_key: str, provider: str, is_stream: bool):
    """Call OpenAI or Gemini (OpenAI-compatible) and normalize the response."""
    url = OPENAI_URL if provider == 'openai' else GEMINI_URL
    upstream_headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    oai_body = _build_openai_body(body)

    if is_stream:
        def generate():
            try:
                with http_requests.post(
                    url, headers=upstream_headers,
                    json=oai_body, stream=True, timeout=300,
                ) as resp:
                    if not resp.ok:
                        err_text = resp.text[:500]
                        yield f"data: {_json.dumps({'type': 'error', 'error': {'message': f'Provider error {resp.status_code}: {err_text}'}})}\n\n".encode()
                        return
                    yield from _openai_stream_to_anthropic(resp)
            except Exception as e:
                yield f"data: {_json.dumps({'type': 'error', 'error': {'message': str(e)}})}\n\n".encode()

        return Response(
            stream_with_context(generate()), status=200,
            content_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    else:
        resp = http_requests.post(url, headers=upstream_headers, json=oai_body, timeout=120)
        if resp.ok:
            try:
                normalized = _normalize_openai_response(resp.json())
                return Response(_json.dumps(normalized), status=200, content_type="application/json")
            except Exception:
                pass  # Fall through to raw passthrough on parse failure
        return Response(
            resp.content, status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "application/json"),
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@claude_bp.route("/messages", methods=["POST"])
def messages():
    """Proxy an AI API call. Routes to Anthropic, OpenAI, or Gemini based on model name."""
    body = request.get_json(silent=True) or {}
    model    = body.get("model", "")
    provider = _get_provider(model)

    api_key = get_api_key(provider)
    if not api_key:
        provider_label = {'anthropic': 'Anthropic', 'openai': 'OpenAI', 'gemini': 'Google Gemini'}.get(provider, provider)
        return jsonify({
            "error": f"{provider_label} API key not configured. "
                     f"Click Settings and enter your {provider_label} API key."
        }), 401

    # Structural validation + content truncation (prompt-injection mitigation)
    if "messages" not in body:
        return jsonify({"error": "Request body must include a 'messages' array"}), 400
    try:
        sanitized_messages, _warnings = _sanitize_messages(body["messages"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    body = {**body, "messages": sanitized_messages}

    # DD audit log (investment due diligence compliance trail)
    dd_context = request.headers.get("X-PSG-DD-Context", "")
    if dd_context:
        import logging
        logging.info("[DD] AI call with DD context: %s (provider: %s)", dd_context[:200], provider)

    is_stream = bool(body.get("stream"))

    if provider == 'anthropic':
        return _call_anthropic(body, api_key, is_stream, request.headers)
    else:
        return _call_openai_compat(body, api_key, provider, is_stream)


@claude_bp.route("/config", methods=["POST"])
def config():
    """Save AI provider API keys to persistent storage."""
    data = request.get_json(silent=True) or {}

    # Map request field → provider name
    key_fields = [
        ('apiKey',       'anthropic'),
        ('openaiApiKey', 'openai'),
        ('geminiApiKey', 'gemini'),
    ]

    for field, provider in key_fields:
        if field not in data:
            continue
        key = data[field].strip()
        if key:
            err = _validate_api_key_format(key, provider)
            if err:
                return jsonify({"error": err}), 400
        save_api_key(key, provider)

    return jsonify({"status": "ok", "configured": get_provider_status()})


@claude_bp.route("/status", methods=["GET"])
def status():
    """Return which AI providers have API keys configured."""
    providers = get_provider_status()
    return jsonify({
        "configured": providers.get('anthropic', False),  # backward-compat field
        "providers":  providers,
    })
