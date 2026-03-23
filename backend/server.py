from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "PSG Executive Intelligence"})

def register_blueprints():
    """Register route blueprints. Each is optional — server starts even if missing."""
    blueprints = [
        ("routes.proxy", "proxy_bp"),
        ("routes.linkedin", "linkedin_bp"),
        ("routes.glassdoor", "glassdoor_bp"),
    ]
    for module_path, bp_name in blueprints:
        try:
            import importlib
            mod = importlib.import_module(module_path)
            app.register_blueprint(getattr(mod, bp_name))
            print(f"  Registered: {module_path}")
        except (ImportError, AttributeError) as e:
            print(f"  Skipped: {module_path} ({e})")

if __name__ == "__main__":
    register_blueprints()
    print("PSG Executive Intelligence Backend running on http://localhost:5001")
    app.run(host="127.0.0.1", port=5001, debug=True)
