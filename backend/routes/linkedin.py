from flask import Blueprint, request, jsonify
from services.linkedin_service import (
    test_connection, search_people, search_shared_connections, validate_cookies
)

linkedin_bp = Blueprint('linkedin', __name__, url_prefix='/linkedin')

def _get_cookies():
    li_at = request.json.get("li_at", "")
    jsessionid = request.json.get("jsessionid", "")
    return li_at, jsessionid

@linkedin_bp.route("/test", methods=["POST"])
def test():
    li_at, jsessionid = _get_cookies()
    result = test_connection(li_at, jsessionid)
    return jsonify(result)

@linkedin_bp.route("/search", methods=["POST"])
def search():
    li_at, jsessionid = _get_cookies()
    if not validate_cookies(li_at, jsessionid):
        return jsonify({"error": "Missing LinkedIn cookies"}), 400
    query = request.json.get("query", "")
    if not query:
        return jsonify({"error": "Missing search query"}), 400
    profiles, error = search_people(query, li_at, jsessionid)
    if error:
        return jsonify({"profiles": [], "error": error})
    return jsonify({"profiles": profiles})

@linkedin_bp.route("/connections", methods=["POST"])
def connections():
    li_at, jsessionid = _get_cookies()
    if not validate_cookies(li_at, jsessionid):
        return jsonify({"error": "Missing LinkedIn cookies"}), 400
    name = request.json.get("name", "")
    company = request.json.get("company", "")
    if not name:
        return jsonify({"error": "Missing name"}), 400
    profiles, err = search_people(f"{name} {company}".strip(), li_at, jsessionid)
    if err or not profiles:
        return jsonify({
            "profileFound": False,
            "connectionDegree": "UNKNOWN",
            "sharedConnections": [],
            "error": err or "Profile not found"
        })
    best = profiles[0]
    result = {
        "profileFound": True,
        "profileUrl": best["profileUrl"],
        "headline": best["headline"],
        "connectionDegree": best["connectionDegree"],
        "sharedConnections": [],
    }
    if best.get("publicId"):
        shared, _ = search_shared_connections(best["publicId"], li_at, jsessionid)
        result["sharedConnections"] = shared
    return jsonify(result)
