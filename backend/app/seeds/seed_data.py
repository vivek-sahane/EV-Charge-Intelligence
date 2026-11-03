"""
Database Seeding Script:
Initializes tables with sample demonstration datasets, creates initial admin user,
and logs dataset records and model metrics if tables are unpopulated.
"""
import os
import json
import pandas as pd
from app.config.config import Config
from app.models.models import (
    db, User, ChargingStation, CountryGrowth, EVModel,
    DatasetRecord, ModelMetric
)

def seed_database(force: bool = False):
    print("Checking database seed status...")
    db.create_all()

    # 1. Seed Admin User
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(username="admin", email="admin@evcharge.ai", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        print("Created default admin user (admin / admin123)")

    sample_dir = Config.SAMPLE_DATA_DIR

    # 2. Seed Charging Stations
    station_count = ChargingStation.query.count()
    if station_count == 0 or force:
        if force:
            ChargingStation.query.delete()
        csv_path = os.path.join(sample_dir, "charging_stations.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            stations = [
                ChargingStation(
                    station_id=str(r["station_id"]),
                    station_name=str(r["station_name"]),
                    country=str(r["country"]),
                    city=str(r["city"]),
                    latitude=float(r["latitude"]),
                    longitude=float(r["longitude"]),
                    station_count=int(r["station_count"]),
                    port_count=int(r["port_count"]),
                    charging_power_kw=float(r["charging_power_kw"]),
                    fast_station_share=float(r["fast_station_share"]),
                    fast_port_share=float(r["fast_port_share"]),
                    median_power_kw=float(r["median_power_kw"]),
                    demand_score=float(r["demand_score"]),
                    is_synthetic=True
                )
                for _, r in df.iterrows()
            ]
            db.session.bulk_save_objects(stations)
            print(f"Seeded {len(stations)} charging stations.")

            # Register dataset record
            if not DatasetRecord.query.filter_by(dataset_type="stations").first():
                rec = DatasetRecord(
                    name="Global Charging Stations Sample",
                    filename="charging_stations.csv",
                    dataset_type="stations",
                    row_count=len(df),
                    is_active=True,
                    is_synthetic=True,
                    file_path=csv_path
                )
                db.session.add(rec)

    # 3. Seed Country Growth
    country_count = CountryGrowth.query.count()
    if country_count == 0 or force:
        if force:
            CountryGrowth.query.delete()
        csv_path = os.path.join(sample_dir, "country_growth.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            countries = [
                CountryGrowth(
                    country=str(r["country"]),
                    station_count=int(r["station_count"]),
                    port_count=int(r["port_count"]),
                    fast_station_share=float(r["fast_station_share"]),
                    median_power_kw=float(r["median_power_kw"]),
                    future_growth_index=float(r["future_growth_index"]),
                    is_synthetic=True
                )
                for _, r in df.iterrows()
            ]
            db.session.bulk_save_objects(countries)
            print(f"Seeded {len(countries)} country growth records.")

            if not DatasetRecord.query.filter_by(dataset_type="growth").first():
                rec = DatasetRecord(
                    name="Country EV Growth Sample",
                    filename="country_growth.csv",
                    dataset_type="growth",
                    row_count=len(df),
                    is_active=True,
                    is_synthetic=True,
                    file_path=csv_path
                )
                db.session.add(rec)

    # 4. Seed EV Models
    ev_count = EVModel.query.count()
    if ev_count == 0 or force:
        if force:
            EVModel.query.delete()
        csv_path = os.path.join(sample_dir, "ev_models.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            models = [
                EVModel(
                    manufacturer=str(r["manufacturer"]),
                    model=str(r["model"]),
                    battery_capacity_kwh=float(r["battery_capacity_kwh"]),
                    max_charging_power_kw=float(r["max_charging_power_kw"]),
                    vehicle_type=str(r["vehicle_type"])
                )
                for _, r in df.iterrows()
            ]
            db.session.bulk_save_objects(models)
            print(f"Seeded {len(models)} EV models.")

            if not DatasetRecord.query.filter_by(dataset_type="ev_models").first():
                rec = DatasetRecord(
                    name="EV Catalog Models Sample",
                    filename="ev_models.csv",
                    dataset_type="ev_models",
                    row_count=len(df),
                    is_active=True,
                    is_synthetic=True,
                    file_path=csv_path
                )
                db.session.add(rec)

    # 5. Seed Model Metrics from metadata
    meta_path = os.path.join(Config.MODEL_DIR, "model_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        for key, m in meta.get("models", {}).items():
            existing = ModelMetric.query.filter_by(model_name=m["model_name"]).first()
            if not existing:
                metric = ModelMetric(
                    model_name=m["model_name"],
                    version=m.get("version", "1.0.0"),
                    r2_score=m["r2_score"],
                    mae=m["mae"],
                    mse=m["mse"],
                    rmse=m["rmse"],
                    metrics_json=json.dumps(m)
                )
                db.session.add(metric)

    db.session.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    with app.app_context():
        seed_database()
