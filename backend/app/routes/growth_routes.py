"""
Country Growth Prediction Routes:
Executes ML prediction pipeline for Country Future Growth Index.
"""
from flask import Blueprint, request, jsonify
from app.ml.model_service import model_service
from app.models.models import db, PredictionLog
import json

growth_bp = Blueprint("growth", __name__, url_prefix="/api")

@growth_bp.route("/predict-country-growth", methods=["POST"])
def predict_growth():
    data = request.get_json() or {}
    try:
        result = model_service.predict_growth(data)
        log = PredictionLog(
            model_type="country_growth_prediction",
            inputs_json=json.dumps(data),
            result_json=json.dumps(result)
        )
        db.session.add(log)
        db.session.commit()
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

@growth_bp.route("/models/growth/info", methods=["GET"])
def growth_info():
    info = model_service.get_growth_info()
    return jsonify(info), 200
