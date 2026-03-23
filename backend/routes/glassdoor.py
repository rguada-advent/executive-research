from flask import Blueprint, request, jsonify
from services.glassdoor_service import scrape_company_reviews

glassdoor_bp = Blueprint('glassdoor', __name__, url_prefix='/glassdoor')

@glassdoor_bp.route("/reviews", methods=["POST"])
def reviews():
    data = request.get_json(silent=True)
    if not data or not data.get("company"):
        return jsonify({"error": "Missing company name"}), 400
    result = scrape_company_reviews(data["company"])
    return jsonify(result)
