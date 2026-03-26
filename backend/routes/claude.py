"""
Flask blueprint that proxies Claude API calls server-side.
The Anthropic API key lives only in the backend (psg_config.json) —
the browser never sees it.
"""
from flask import Blueprint, request, jsonify, Response, stream_with_context
import requests as http_requests
from services.claude_config import get_api_key, save_api_key

claude_bp = Blueprint("claude", __name__, url_prefix="/claude")

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"


@claude_bp.route("/messages", methods=["POST"])
def messages():
    """Proxy a Claude API call. Supports both streaming and non-streaming modes."""
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "API key not configured. Enter your Anthropic API key in the app header."}), 401

    body = request.get_json(silent=True) or {}

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
    if key and not key.startswith("sk-ant-"):
        return jsonify({"error": "Invalid API key format — must start with sk-ant-"}), 400
    save_api_key(key)
    return jsonify({"status": "ok", "configured": bool(key)})


@claude_bp.route("/status", methods=["GET"])
def status():
    """Check whether an API key is currently configured."""
    return jsonify({"configured": bool(get_api_key())})
