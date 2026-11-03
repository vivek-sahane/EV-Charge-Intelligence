"""
Automated Backend Test Suite:
Validates all REST API endpoints, ML predictions, clustering, compatibility,
dataset validation, and chatbot tool execution.
"""
import io
import json
import pytest
from app import create_app
from app.models.models import db, User, ChargingStation, CountryGrowth, EVModel

@pytest.fixture(scope="module")
def test_client():
    app = create_app()
    app.config["TESTING"] = True
    
    with app.app_context():
        testing_client = app.test_client()
        yield testing_client

# 1. System & Health Tests
def test_health_endpoint(test_client):
    res = test_client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] in ["healthy", "degraded"]
    assert "models_status" in data

def test_health_endpoint_returns_service_unavailable_when_degraded(test_client, monkeypatch):
    from app.ml.model_service import model_service

    monkeypatch.setattr(model_service, "demand_model", None)
    res = test_client.get("/api/health")

    assert res.status_code == 503
    assert res.get_json()["status"] == "degraded"

def test_model_info_endpoint(test_client):
    res = test_client.get("/api/model-info")
    assert res.status_code == 200
    data = res.get_json()
    assert "models" in data

# 2. Dashboard Tests
def test_dashboard_summary(test_client):
    res = test_client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_charging_stations"] > 0
    assert data["total_charging_ports"] > 0
    assert "data_source_label" in data

def test_dashboard_countries(test_client):
    res = test_client.get("/api/dashboard/countries")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_dashboard_charts(test_client):
    res = test_client.get("/api/dashboard/charts")
    assert res.status_code == 200
    data = res.get_json()
    assert "infrastructure_by_country" in data
    assert "power_distribution" in data

def test_dashboard_stations(test_client):
    res = test_client.get("/api/dashboard/stations?page=1&per_page=10")
    assert res.status_code == 200
    data = res.get_json()
    assert "stations" in data
    assert len(data["stations"]) > 0

# 3. Demand Prediction Tests
def test_predict_demand_valid(test_client):
    payload = {
        "station_count": 20,
        "port_count": 60,
        "fast_station_share": 0.4,
        "fast_port_share": 0.5,
        "median_power_kw": 120.0
    }
    res = test_client.post("/api/predict-demand", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "demand_score" in data
    assert 0.0 <= data["demand_score"] <= 100.0

def test_predict_demand_invalid(test_client):
    payload = {"station_count": -5}
    res = test_client.post("/api/predict-demand", json=payload)
    assert res.status_code in [400, 500]

# 4. Growth Prediction Tests
def test_predict_growth_valid(test_client):
    payload = {
        "station_count": 30000,
        "port_count": 100000,
        "fast_station_share": 0.3,
        "median_power_kw": 100.0
    }
    res = test_client.post("/api/predict-country-growth", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "future_growth_index" in data
    assert 0.0 <= data["future_growth_index"] <= 100.0

# 5. Clustering Tests
def test_clustering_kmeans(test_client):
    payload = {"algorithm": "kmeans", "k": 4}
    res = test_client.post("/api/cluster-locations", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["algorithm"] == "kmeans"
    assert len(data["clusters"]) == 4

def test_clustering_dbscan(test_client):
    payload = {"algorithm": "dbscan", "eps_km": 150.0, "min_samples": 3}
    res = test_client.post("/api/cluster-locations", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["algorithm"] == "dbscan"
    assert "hotspots" in data
    assert "noise_count" in data

# 6. Compatibility Tests
def test_compatibility_low_power(test_client):
    res = test_client.post("/api/predict-compatibility", json={"charging_power_kw": 50.0})
    assert res.status_code == 200
    data = res.get_json()
    comp_models = [m["model"] for m in data["compatible_models"]]
    incomp_models = [m["model"] for m in data["incompatible_models"]]
    assert "Leaf SV PLUS" in comp_models
    assert "Model 3 Long Range" in incomp_models

def test_compatibility_high_power(test_client):
    res = test_client.post("/api/predict-compatibility", json={"charging_power_kw": 250.0})
    assert res.status_code == 200
    data = res.get_json()
    comp_models = [m["model"] for m in data["compatible_models"]]
    assert "Model 3 Long Range" in comp_models
    assert "Leaf SV PLUS" in comp_models

# 7. AI Chatbot Tests
def test_chat_interaction(test_client):
    payload = {
        "message": "Predict EV demand if station count is 20 and port count is 60 with 150 kW",
        "session_id": "test_session_123"
    }
    res = test_client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "content" in data
    assert len(data["content"]) > 10

def test_gemini_request_uses_configured_api_key_and_model(monkeypatch):
    from app.chatbot.assistant_service import assistant_service, requests as assistant_requests
    from app.config.config import Config

    captured = {}

    class GeminiResponse:
        status_code = 200

        @staticmethod
        def json():
            return {"candidates": [{"content": {"parts": [{"text": "Gemini response"}]}}]}

    def fake_post(url, **kwargs):
        captured["url"] = url
        captured.update(kwargs)
        return GeminiResponse()

    monkeypatch.setattr(Config, "GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setattr(Config, "AI_MODEL", "gemini-test-model")
    monkeypatch.setattr(assistant_requests, "post", fake_post)

    result = assistant_service._call_gemini("test-session", "test question")

    assert result["content"] == "Gemini response"
    assert captured["url"].endswith("/models/gemini-test-model:generateContent")
    assert "test-gemini-key" not in captured["url"]
    assert captured["headers"]["x-goog-api-key"] == "test-gemini-key"
    assert captured["timeout"] == Config.REQUEST_TIMEOUT

def test_chat_history_and_clear(test_client):
    res = test_client.get("/api/chat/history?session_id=test_session_123")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["messages"]) >= 2

    del_res = test_client.delete("/api/chat/history?session_id=test_session_123")
    assert del_res.status_code == 200

# 8. Dataset Upload & Validation Tests
def test_csv_upload_validation(test_client):
    csv_data = (
        "country,station_count,port_count,fast_station_share,median_power_kw,future_growth_index\n"
        "Testland,5000,15000,0.35,120.0,85.5\n"
        "Testland,5000,15000,0.35,120.0,85.5\n"
    )
    data = {
        "file": (io.BytesIO(csv_data.encode("utf-8")), "test_growth.csv"),
        "name": "Test Growth Dataset"
    }
    res = test_client.post("/api/datasets/upload", data=data, content_type="multipart/form-data")
    assert res.status_code == 201
    res_data = res.get_json()["data"]
    assert res_data["dataset_type"] == "growth"
    assert res_data["duplicates_removed"] == 1
