"""
Demand Prediction Routes:
Executes ML prediction pipeline for EV demand score and retrieves model metadata.
"""
from flask import Blueprint, request, jsonify
from app.ml.model_service import model_service
from app.models.models import db, PredictionLog
import json

demand_bp = Blueprint("demand", __name__, url_prefix="/api")

@demand_bp.route("/predict-demand", methods=["POST"])
def predict_demand():
    data = request.get_json() or {}
    try:
        result = model_service.predict_demand(data)
        # Log prediction
        log = PredictionLog(
            model_type="demand_prediction",
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

@demand_bp.route("/models/demand/info", methods=["GET"])
def demand_info():
    info = model_service.get_demand_info()
    return jsonify(info), 200
