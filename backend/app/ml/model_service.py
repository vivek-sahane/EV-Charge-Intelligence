"""
Model Service:
Encapsulates loading and inference for Demand and Country Growth models.
Provides caching, input validation, and metric retrieval.
"""
import os
import json
import joblib
import pandas as pd
from app.config.config import Config
from app.ml.preprocessor import EVPreprocessor

class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.model_dir = Config.MODEL_DIR
        self.demand_model = None
        self.demand_preprocessor = None
        self.growth_model = None
        self.growth_preprocessor = None
        self.metadata = {}
        self.load_artifacts()
        self._initialized = True

    def load_artifacts(self):
        """Loads serialized models, preprocessors, and metadata."""
        demand_model_path = os.path.join(self.model_dir, "demand_model.joblib")
        demand_prep_path = os.path.join(self.model_dir, "demand_preprocessor.joblib")
        growth_model_path = os.path.join(self.model_dir, "growth_model.joblib")
        growth_prep_path = os.path.join(self.model_dir, "growth_preprocessor.joblib")
        meta_path = os.path.join(self.model_dir, "model_metadata.json")

        if os.path.exists(demand_model_path) and os.path.exists(demand_prep_path):
            self.demand_model = joblib.load(demand_model_path)
            self.demand_preprocessor = joblib.load(demand_prep_path)

        if os.path.exists(growth_model_path) and os.path.exists(growth_prep_path):
            self.growth_model = joblib.load(growth_model_path)
            self.growth_preprocessor = joblib.load(growth_prep_path)

        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

    def predict_demand(self, features: dict) -> dict:
        """
        Predicts demand score given:
        station_count, port_count, fast_station_share, fast_port_share, median_power_kw
        """
        if self.demand_model is None or self.demand_preprocessor is None:
            self.load_artifacts()
            if self.demand_model is None:
                raise RuntimeError("Demand prediction model not found or failed to load.")

        required = ["station_count", "port_count", "fast_station_share", "fast_port_share", "median_power_kw"]
        clean_inputs = {}
        for k in required:
            if k not in features:
                raise ValueError(f"Missing required parameter: {k}")
            try:
                clean_inputs[k] = float(features[k])
            except (ValueError, TypeError):
                raise ValueError(f"Invalid numeric value for {k}: {features[k]}")

        # Validate range constraints
        if clean_inputs["station_count"] < 0 or clean_inputs["port_count"] < 0:
            raise ValueError("Station count and port count must be non-negative.")
        if not (0.0 <= clean_inputs["fast_station_share"] <= 1.0):
            raise ValueError("fast_station_share must be between 0.0 and 1.0.")
        if not (0.0 <= clean_inputs["fast_port_share"] <= 1.0):
            raise ValueError("fast_port_share must be between 0.0 and 1.0.")
        if clean_inputs["median_power_kw"] <= 0:
            raise ValueError("median_power_kw must be positive.")

        # Transform & Predict
        X_proc = self.demand_preprocessor.transform(clean_inputs)
        raw_pred = float(self.demand_model.predict(X_proc)[0])
        bounded_pred = round(max(0.0, min(100.0, raw_pred)), 2)

        # Confidence category
        tier = "High" if bounded_pred >= 70 else "Moderate" if bounded_pred >= 40 else "Low"

        return {
            "demand_score": bounded_pred,
            "demand_tier": tier,
            "inputs": clean_inputs,
            "model_version": self.metadata.get("models", {}).get("demand_prediction", {}).get("version", "1.0.0")
        }

    def predict_growth(self, features: dict) -> dict:
        """
        Predicts future growth index given:
        station_count, port_count, fast_station_share, median_power_kw
        """
        if self.growth_model is None or self.growth_preprocessor is None:
            self.load_artifacts()
            if self.growth_model is None:
                raise RuntimeError("Country growth prediction model not found or failed to load.")

        required = ["station_count", "port_count", "fast_station_share", "median_power_kw"]
        clean_inputs = {}
        for k in required:
            if k not in features:
                raise ValueError(f"Missing required parameter: {k}")
            try:
                clean_inputs[k] = float(features[k])
            except (ValueError, TypeError):
                raise ValueError(f"Invalid numeric value for {k}: {features[k]}")

        if clean_inputs["station_count"] < 0 or clean_inputs["port_count"] < 0:
            raise ValueError("Station count and port count must be non-negative.")
        if not (0.0 <= clean_inputs["fast_station_share"] <= 1.0):
            raise ValueError("fast_station_share must be between 0.0 and 1.0.")
        if clean_inputs["median_power_kw"] <= 0:
            raise ValueError("median_power_kw must be positive.")

        X_proc = self.growth_preprocessor.transform(clean_inputs)
        raw_pred = float(self.growth_model.predict(X_proc)[0])
        bounded_pred = round(max(0.0, min(100.0, raw_pred)), 2)

        tier = "Exponential" if bounded_pred >= 75 else "Strong" if bounded_pred >= 50 else "Moderate" if bounded_pred >= 25 else "Emerging"

        return {
            "future_growth_index": bounded_pred,
            "growth_category": tier,
            "inputs": clean_inputs,
            "model_version": self.metadata.get("models", {}).get("country_growth_prediction", {}).get("version", "1.0.0")
        }

    def get_metadata(self) -> dict:
        if not self.metadata:
            self.load_artifacts()
        return self.metadata

    def get_demand_info(self) -> dict:
        meta = self.get_metadata()
        return meta.get("models", {}).get("demand_prediction", {})

    def get_growth_info(self) -> dict:
        meta = self.get_metadata()
        return meta.get("models", {}).get("country_growth_prediction", {})

model_service = ModelService()
