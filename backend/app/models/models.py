from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def get_utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="analyst")  # 'admin', 'analyst', 'viewer'
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ChargingStation(db.Model):
    __tablename__ = "charging_stations"

    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    station_name = db.Column(db.String(128), nullable=False)
    country = db.Column(db.String(64), nullable=False, index=True)
    city = db.Column(db.String(64), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    station_count = db.Column(db.Integer, nullable=False, default=1)
    port_count = db.Column(db.Integer, nullable=False, default=1)
    charging_power_kw = db.Column(db.Float, nullable=False)
    fast_station_share = db.Column(db.Float, nullable=False, default=0.0)
    fast_port_share = db.Column(db.Float, nullable=False, default=0.0)
    median_power_kw = db.Column(db.Float, nullable=False)
    demand_score = db.Column(db.Float, nullable=False)
    is_synthetic = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "station_id": self.station_id,
            "station_name": self.station_name,
            "country": self.country,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "station_count": self.station_count,
            "port_count": self.port_count,
            "charging_power_kw": self.charging_power_kw,
            "fast_station_share": self.fast_station_share,
            "fast_port_share": self.fast_port_share,
            "median_power_kw": self.median_power_kw,
            "demand_score": self.demand_score,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CountryGrowth(db.Model):
    __tablename__ = "countries"

    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(db.String(64), unique=True, nullable=False, index=True)
    station_count = db.Column(db.Integer, nullable=False)
    port_count = db.Column(db.Integer, nullable=False)
    fast_station_share = db.Column(db.Float, nullable=False)
    median_power_kw = db.Column(db.Float, nullable=False)
    future_growth_index = db.Column(db.Float, nullable=False)
    is_synthetic = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "country": self.country,
            "station_count": self.station_count,
            "port_count": self.port_count,
            "fast_station_share": self.fast_station_share,
            "median_power_kw": self.median_power_kw,
            "future_growth_index": self.future_growth_index,
            "is_synthetic": self.is_synthetic,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class EVModel(db.Model):
    __tablename__ = "ev_models"

    id = db.Column(db.Integer, primary_key=True)
    manufacturer = db.Column(db.String(64), nullable=False, index=True)
    model = db.Column(db.String(128), nullable=False)
    battery_capacity_kwh = db.Column(db.Float, nullable=False)
    max_charging_power_kw = db.Column(db.Float, nullable=False)
    vehicle_type = db.Column(db.String(32), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "battery_capacity_kwh": self.battery_capacity_kwh,
            "max_charging_power_kw": self.max_charging_power_kw,
            "vehicle_type": self.vehicle_type,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class DatasetRecord(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    dataset_type = db.Column(db.String(32), nullable=False)  # 'stations', 'growth', 'ev_models'
    row_count = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)
    is_synthetic = db.Column(db.Boolean, default=False)
    file_path = db.Column(db.String(512), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "filename": self.filename,
            "dataset_type": self.dataset_type,
            "row_count": self.row_count,
            "is_active": self.is_active,
            "is_synthetic": self.is_synthetic,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None
        }

class ModelMetric(db.Model):
    __tablename__ = "model_metrics"

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(64), nullable=False, index=True)
    version = db.Column(db.String(32), nullable=False, default="1.0.0")
    r2_score = db.Column(db.Float, nullable=False)
    mae = db.Column(db.Float, nullable=False)
    mse = db.Column(db.Float, nullable=False)
    rmse = db.Column(db.Float, nullable=False)
    metrics_json = db.Column(db.Text, nullable=True)
    trained_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "model_name": self.model_name,
            "version": self.version,
            "r2_score": self.r2_score,
            "mae": self.mae,
            "mse": self.mse,
            "rmse": self.rmse,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None
        }

class PredictionLog(db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(64), nullable=False)
    inputs_json = db.Column(db.Text, nullable=False)
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "model_type": self.model_type,
            "inputs_json": self.inputs_json,
            "result_json": self.result_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    title = db.Column(db.String(256), default="EV Intelligence Consultation")
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    messages = db.relationship("ChatMessage", backref="session", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages)
        }

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), db.ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)  # 'user', 'assistant', 'system', 'tool'
    content = db.Column(db.Text, nullable=False)
    tool_calls_json = db.Column(db.Text, nullable=True)
    tool_responses_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "tool_calls_json": self.tool_calls_json,
            "tool_responses_json": self.tool_responses_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
