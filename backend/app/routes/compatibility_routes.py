"""
EV Compatibility API Routes:
Calculates vehicle compatibility against station power ratings (kW).
"""
from flask import Blueprint, request, jsonify
from app.ml.compatibility_service import compatibility_service

compatibility_bp = Blueprint("compatibility", __name__, url_prefix="/api")

@compatibility_bp.route("/predict-compatibility", methods=["POST"])
def predict_compatibility():
    data = request.get_json() or {}
    power = data.get("charging_power_kw") or data.get("power_kw") or data.get("power")
    vehicle_type = data.get("vehicle_type")

    if power is None:
        return jsonify({"error": "charging_power_kw is required."}), 400

    try:
        res = compatibility_service.check_compatibility(float(power), vehicle_type_filter=vehicle_type)
        return jsonify(res), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Evaluation error: {str(e)}"}), 500

@compatibility_bp.route("/ev-models", methods=["GET"])
def ev_models():
    models = compatibility_service.get_all_ev_models()
    return jsonify({"count": len(models), "models": models}), 200
