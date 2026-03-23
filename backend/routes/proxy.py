from flask import Blueprint, request, jsonify, Response
import requests as http_requests
from urllib.parse import urlparse

proxy_bp = Blueprint('proxy', __name__)

ALLOWED_HOSTS = [
    "www.linkedin.com",
    "www.courtlistener.com",
    "www.glassdoor.com",
    "www.glassdoor.co.uk",
]

@proxy_bp.route("/proxy", methods=["POST", "OPTIONS"])
def proxy():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True)
    if not data or "url" not in data:
        return jsonify({"error": "Missing 'url' in request body"}), 400

    url = data["url"]
    method = data.get("method", "GET").upper()
    headers = data.get("headers", {})

    parsed = urlparse(url)
    if parsed.hostname not in ALLOWED_HOSTS:
        return jsonify({"error": f"Domain '{parsed.hostname}' not allowed"}), 403

    try:
        resp = http_requests.request(
            method=method,
            url=url,
            headers=headers,
            timeout=25,
            allow_redirects=True
        )
        excluded_headers = ['content-encoding', 'transfer-encoding', 'connection']
        response_headers = {
            k: v for k, v in resp.headers.items()
            if k.lower() not in excluded_headers
        }
        return Response(
            resp.content,
            status=resp.status_code,
            headers=response_headers
        )
    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Upstream request timed out"}), 504
    except http_requests.exceptions.ConnectionError:
        return jsonify({"error": "Could not connect to upstream"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500
