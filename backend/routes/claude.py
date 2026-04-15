"""
Flask blueprint that proxies Claude API calls server-side.
The Anthropic API key lives only in the backend (psg_config.json) —
the browser never sees it.
"""
from flask import Blueprint, request, jsonify, Response, stream_with_context
import re
import requests as http_requests
from services.claude_config import get_api_key, save_api_key

claude_bp = Blueprint("claude", __name__, url_prefix="/claude")

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

# Valid Anthropic API key pattern: "sk-ant-" followed by alphanumeric/dash/underscore.
# Length bounds (40–200 chars) catch obviously truncated or injected values.
_API_KEY_RE = re.compile(r'^sk-ant-[A-Za-z0-9_\-]+$')
_API_KEY_MIN_LEN = 40
_API_KEY_MAX_LEN = 200

# Per-message content truncation limit (characters). Prevents extremely large
# user-supplied strings from being forwarded verbatim to Anthropic.
_MAX_CONTENT_CHARS = 50_000


def _validate_api_key_format(key: str) -> str | None:
    """Return an error string if the key is malformed, else None."""
    if len(key) < _API_KEY_MIN_LEN or len(key) > _API_KEY_MAX_LEN:
        return f"Invalid API key length (must be {_API_KEY_MIN_LEN}–{_API_KEY_MAX_LEN} characters)"
    if not _API_KEY_RE.match(key):
        return "Invalid API key format — must match sk-ant-[alphanumeric/dash/underscore]"
    return None


def _sanitize_messages(messages: list) -> tuple[list, list]:
    """
    Validate structure and truncate oversized content blocks.

    Returns (sanitized_messages, warnings).  Raises ValueError on structural
    problems that should hard-fail the request.
    """
    if not isinstance(messages, list):
        raise ValueError("'messages' must be an array")

    warnings = []
    sanitized = []

    for idx, msg in enumerate(messages):
        if not isinstance(msg, dict):
            raise ValueError(f"Message at index {idx} must be an object")
        if "role" not in msg or "content" not in msg:
            raise ValueError(f"Message at index {idx} must have 'role' and 'content' fields")

        content = msg["content"]

        # content can be a plain string or an array of content blocks (Anthropic spec)
        if isinstance(content, str):
            if len(content) > _MAX_CONTENT_CHARS:
                warnings.append(f"Message {idx} content truncated from {len(content)} to {_MAX_CONTENT_CHARS} chars")
                content = content[:_MAX_CONTENT_CHARS]
            sanitized.append({**msg, "content": content})
        elif isinstance(content, list):
            sanitized_blocks = []
            for bidx, block in enumerate(content):
                if isinstance(block, dict) and isinstance(block.get("text"), str):
                    text = block["text"]
                    if len(text) > _MAX_CONTENT_CHARS:
                        warnings.append(f"Message {idx} block {bidx} text truncated from {len(text)} to {_MAX_CONTENT_CHARS} chars")
                        block = {**block, "text": text[:_MAX_CONTENT_CHARS]}
                sanitized_blocks.append(block)
            sanitized.append({**msg, "content": sanitized_blocks})
        else:
            # Unknown content shape — pass through unchanged (don't break future API extensions)
            sanitized.append(msg)

    return sanitized, warnings


@claude_bp.route("/messages", methods=["POST"])
def messages():
    """Proxy a Claude API call. Supports both streaming and non-streaming modes."""
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "API key not configured. Enter your Anthropic API key in the app header."}), 401

    body = request.get_json(silent=True) or {}

    # --- Structural validation + content truncation (prompt-injection mitigation) ---
    if "messages" not in body:
        return jsonify({"error": "Request body must include a 'messages' array"}), 400
    try:
        sanitized_messages, _warnings = _sanitize_messages(body["messages"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    body = {**body, "messages": sanitized_messages}

    upstream_headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    # Forward beta headers (e.g. web-search-2025-03-05 for search-enabled agents)
    if "anthropic-beta" in request.headers:
        upstream_headers["anthropic-beta"] = request.headers["anthropic-beta"]

    if body.get("stream"):
        def generate():
            try:
                with http_requests.post(
                    ANTHROPIC_URL,
                    headers=upstream_headers,
                    json=body,
                    stream=True,
                    timeout=300,
                ) as resp:
                    for chunk in resp.iter_content(chunk_size=None):
                        if chunk:
                            yield chunk
            except Exception as e:
                import json as _json
                yield f"data: {_json.dumps({'type': 'error', 'error': {'message': str(e)}})}\n\n".encode()

        return Response(
            stream_with_context(generate()),
            status=200,
            content_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    else:
        resp = http_requests.post(
            ANTHROPIC_URL,
            headers=upstream_headers,
            json=body,
            timeout=120,
        )
        return Response(
            resp.content,
            status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "application/json"),
        )


@claude_bp.route("/config", methods=["POST"])
def config():
    """Save the Anthropic API key to persistent storage."""
    data = request.get_json(silent=True) or {}
    key = data.get("apiKey", "").strip()
    if key:
        err = _validate_api_key_format(key)
        if err:
            return jsonify({"error": err}), 400
    save_api_key(key)
    return jsonify({"status": "ok", "configured": bool(key)})


@claude_bp.route("/status", methods=["GET"])
def status():
    """Check whether an API key is currently configured."""
    return jsonify({"configured": bool(get_api_key())})
