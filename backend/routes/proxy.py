from flask import Blueprint, request, jsonify, Response
import requests as http_requests
from urllib.parse import urlparse

proxy_bp = Blueprint('proxy', __name__)

ALLOWED_HOSTS = [
    "www.courtlistener.com",
    "www.glassdoor.com",
    "www.glassdoor.co.uk",
]

# Only these methods are permitted — prevents callers from issuing mutating
# requests (DELETE, PUT, PATCH) to allowlisted hosts via the proxy.
ALLOWED_METHODS = {"GET", "POST"}

# Only these request headers are forwarded to the upstream host.
# All others (Host, Content-Length, Transfer-Encoding, X-Forwarded-*, etc.)
# are stripped to prevent header injection / request-smuggling attacks.
ALLOWED_REQUEST_HEADERS = {
    "authorization",
    "cookie",
    "csrf-token",
    "content-type",
    "accept",
}

# Maximum bytes read from the proxied response body (5 MB).
MAX_RESPONSE_BYTES = 5 * 1024 * 1024


@proxy_bp.route("/proxy", methods=["POST", "OPTIONS"])
def proxy():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True)
    if not data or "url" not in data:
        return jsonify({"error": "Missing 'url' in request body"}), 400

    url = data["url"]
    method = data.get("method", "GET").upper()
    caller_headers = data.get("headers", {})

    # --- Method allowlist ---
    if method not in ALLOWED_METHODS:
        return jsonify({"error": f"Method '{method}' not allowed. Use GET or POST."}), 405

    # --- Scheme validation: only https:// is permitted ---
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return jsonify({"error": "Only https:// URLs are allowed"}), 403

    # --- Hostname allowlist ---
    if parsed.hostname not in ALLOWED_HOSTS:
        return jsonify({"error": f"Domain '{parsed.hostname}' not allowed"}), 403

    # --- Header allowlist: strip everything not explicitly permitted ---
    safe_headers = {
        k: v for k, v in caller_headers.items()
        if k.lower() in ALLOWED_REQUEST_HEADERS
    }

    try:
        resp = http_requests.request(
            method=method,
            url=url,
            headers=safe_headers,
            timeout=25,
            allow_redirects=True,
            stream=True,
        )

        # --- Response body size cap (5 MB) ---
        chunks = []
        total = 0
        for chunk in resp.iter_content(chunk_size=65536):
            if chunk:
                total += len(chunk)
                if total > MAX_RESPONSE_BYTES:
                    return jsonify({"error": "Upstream response too large (> 5 MB)"}), 502
                chunks.append(chunk)
        body = b"".join(chunks)

        excluded_headers = ['content-encoding', 'transfer-encoding', 'connection']
        response_headers = {
            k: v for k, v in resp.headers.items()
            if k.lower() not in excluded_headers
        }
        return Response(
            body,
            status=resp.status_code,
            headers=response_headers,
        )
    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Upstream request timed out"}), 504
    except http_requests.exceptions.ConnectionError:
        return jsonify({"error": "Could not connect to upstream"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500
