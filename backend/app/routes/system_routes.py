"""
System & Operational API Routes:
Health checks, Model Info, Retraining Trigger, and API Documentation specs.
"""
import os
import subprocess
import sys
from flask import Blueprint, jsonify
from app.ml.model_service import model_service
from app.config.config import Config
from app.models.models import db, ChargingStation, CountryGrowth, EVModel

system_bp = Blueprint("system", __name__, url_prefix="/api")

@system_bp.route("/health", methods=["GET"])
def health():
    db_status = "healthy"
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    models_loaded = (
        model_service.demand_model is not None and
        model_service.growth_model is not None
    )

    status = "healthy" if db_status == "healthy" and models_loaded else "degraded"
    return jsonify({
        "status": status,
        "service": "EV Charge Intelligence Platform",
        "database": db_status,
        "models_status": "loaded" if models_loaded else "unloaded",
        "version": "1.0.0"
    }), 200 if status == "healthy" else 503

@system_bp.route("/model-info", methods=["GET"])
def model_info():
    metadata = model_service.get_metadata()
    return jsonify(metadata), 200

@system_bp.route("/retrain-models", methods=["POST"])
def retrain_models():
    """Triggers model re-training pipeline and reloads artifacts."""
    train_script = os.path.join(os.path.dirname(Config.BASE_DIR), "train", "train_models.py")
    if not os.path.exists(train_script):
        return jsonify({"error": "Training script train_models.py not found."}), 500

    try:
        # Run training script in subprocess
        res = subprocess.run(
            [sys.executable, train_script],
            capture_output=True,
            text=True,
            check=True
        )
        # Reload models in memory
        model_service.load_artifacts()
        return jsonify({
            "message": "Models successfully retrained and reloaded.",
            "output": res.stdout[-400:] if res.stdout else "Done"
        }), 200
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "Model retraining failed.",
            "details": e.stderr
        }), 500

@system_bp.route("/docs", methods=["GET"])
def openapi_docs():
    """Returns OpenAPI 3.0 specification for all REST endpoints."""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "EV Charge Intelligence API",
            "version": "1.0.0",
            "description": "Production REST API for EV Charging Infrastructure Analytics, ML Predictions, and AI Assistant"
        },
        "paths": {
            "/api/dashboard/summary": {"get": {"summary": "Global KPI metrics"}},
            "/api/dashboard/countries": {"get": {"summary": "Country rankings and growth metrics"}},
            "/api/dashboard/charts": {"get": {"summary": "Aggregated chart visualization feeds"}},
            "/api/dashboard/stations": {"get": {"summary": "Paginated charging station records"}},
            "/api/predict-demand": {"post": {"summary": "EV Demand score GradientBoosting prediction"}},
            "/api/predict-country-growth": {"post": {"summary": "Country Future Growth Index prediction"}},
            "/api/cluster-locations": {"post": {"summary": "KMeans or DBSCAN geographic clustering"}},
            "/api/predict-compatibility": {"post": {"summary": "EV model power compatibility analysis"}},
            "/api/ev-models": {"get": {"summary": "List all cataloged EV models"}},
            "/api/datasets": {"get": {"summary": "List all uploaded and active datasets"}},
            "/api/datasets/upload": {"post": {"summary": "Upload and validate CSV dataset"}},
            "/api/chat": {"post": {"summary": "Send query to EV Intelligence AI Assistant"}},
            "/api/chat/history": {"get": {"summary": "Retrieve chat session history"}},
            "/api/health": {"get": {"summary": "System and database health check"}},
            "/api/model-info": {"get": {"summary": "Model evaluation metrics and feature importances"}}
        }
    }
    return jsonify(spec), 200
