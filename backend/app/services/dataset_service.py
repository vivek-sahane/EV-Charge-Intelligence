"""
Dataset Management Service:
Validates, parses, cleans, previews, and ingests user-uploaded CSV files.
Tracks dataset versions, generates statistics, and allows downloading cleaned files.
"""
import os
import uuid
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
from app.config.config import Config
from app.models.models import db, ChargingStation, CountryGrowth, EVModel, DatasetRecord

REQUIRED_SCHEMAS = {
    "stations": {
        "required_cols": [
            "station_id", "station_name", "country", "city", "latitude", "longitude",
            "station_count", "port_count", "charging_power_kw",
            "fast_station_share", "fast_port_share", "median_power_kw", "demand_score"
        ],
        "numeric_cols": [
            "latitude", "longitude", "station_count", "port_count",
            "charging_power_kw", "fast_station_share", "fast_port_share",
            "median_power_kw", "demand_score"
        ]
    },
    "growth": {
        "required_cols": [
            "country", "station_count", "port_count",
            "fast_station_share", "median_power_kw", "future_growth_index"
        ],
        "numeric_cols": [
            "station_count", "port_count", "fast_station_share",
            "median_power_kw", "future_growth_index"
        ]
    },
    "ev_models": {
        "required_cols": [
            "manufacturer", "model", "battery_capacity_kwh",
            "max_charging_power_kw", "vehicle_type"
        ],
        "numeric_cols": [
            "battery_capacity_kwh", "max_charging_power_kw"
        ]
    }
}

class DatasetService:
    @staticmethod
    def detect_dataset_type(columns: list) -> str:
        cols_set = set(columns)
        for dtype, schema in REQUIRED_SCHEMAS.items():
            if set(schema["required_cols"]).issubset(cols_set):
                return dtype
        return "unknown"

    @staticmethod
    def process_csv_upload(file_storage, custom_name: str = None) -> dict:
        filename = secure_filename(file_storage.filename)
        if not filename.endswith(".csv"):
            raise ValueError("Only CSV files are supported.")

        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file_storage.save(upload_path)

        # Read CSV
        try:
            df = pd.read_csv(upload_path)
        except Exception as e:
            if os.path.exists(upload_path):
                os.remove(upload_path)
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        # Detect dataset type
        dtype = DatasetService.detect_dataset_type(df.columns.tolist())
        if dtype == "unknown":
            if os.path.exists(upload_path):
                os.remove(upload_path)
            raise ValueError(
                f"Unrecognized CSV format. Headers did not match any of the supported datasets "
                f"(Charging Stations, Country Growth, or EV Models)."
            )

        schema = REQUIRED_SCHEMAS[dtype]
        raw_rows = len(df)

        # Missing values detection
        missing_counts = {col: int(df[col].isna().sum()) for col in df.columns}
        total_missing = sum(missing_counts.values())

        # Duplicate detection
        duplicate_count = int(df.duplicated().sum())

        # Clean dataframe
        cleaned_df = df.drop_duplicates()
        for col in schema["numeric_cols"]:
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
            # Fill numeric with median if missing
            median_val = float(cleaned_df[col].median()) if not cleaned_df[col].isna().all() else 0.0
            cleaned_df[col] = cleaned_df[col].fillna(median_val)

        # Drop any remaining non-numeric critical nulls
        cleaned_df = cleaned_df.dropna(subset=[col for col in schema["required_cols"] if col not in schema["numeric_cols"]])

        # Save cleaned version
        cleaned_filename = f"cleaned_{unique_filename}"
        cleaned_path = os.path.join(Config.UPLOAD_FOLDER, cleaned_filename)
        cleaned_df.to_csv(cleaned_path, index=False)

        # Calculate statistics
        stats = {}
        for col in schema["numeric_cols"]:
            if col in cleaned_df.columns:
                stats[col] = {
                    "mean": round(float(cleaned_df[col].mean()), 2),
                    "min": round(float(cleaned_df[col].min()), 2),
                    "max": round(float(cleaned_df[col].max()), 2),
                    "std": round(float(cleaned_df[col].std()), 2) if len(cleaned_df) > 1 else 0.0
                }

        # Ingest into database
        DatasetService.ingest_data(dtype, cleaned_df, is_synthetic=False)

        # Record dataset
        record = DatasetRecord(
            name=custom_name or filename,
            filename=unique_filename,
            dataset_type=dtype,
            row_count=len(cleaned_df),
            is_active=True,
            is_synthetic=False,
            file_path=cleaned_path
        )
        db.session.add(record)
        db.session.commit()

        # Preview (first 10 rows)
        preview_records = cleaned_df.head(10).to_dict(orient="records")

        return {
            "dataset_id": record.id,
            "name": record.name,
            "dataset_type": dtype,
            "raw_row_count": raw_rows,
            "cleaned_row_count": len(cleaned_df),
            "duplicates_removed": duplicate_count,
            "missing_values_detected": missing_counts,
            "total_missing_values": total_missing,
            "statistics": stats,
            "preview": preview_records,
            "is_synthetic": False
        }

    @staticmethod
    def ingest_data(dataset_type: str, df: pd.DataFrame, is_synthetic: bool = False):
        """Replaces or updates table records for the ingested dataset type."""
        if dataset_type == "stations":
            # Clear previous stations if uploading real data
            if not is_synthetic:
                ChargingStation.query.delete()
            stations = []
            for _, r in df.iterrows():
                stations.append(ChargingStation(
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
                    is_synthetic=is_synthetic
                ))
            db.session.bulk_save_objects(stations)
            db.session.commit()

        elif dataset_type == "growth":
            if not is_synthetic:
                CountryGrowth.query.delete()
            countries = []
            for _, r in df.iterrows():
                countries.append(CountryGrowth(
                    country=str(r["country"]),
                    station_count=int(r["station_count"]),
                    port_count=int(r["port_count"]),
                    fast_station_share=float(r["fast_station_share"]),
                    median_power_kw=float(r["median_power_kw"]),
                    future_growth_index=float(r["future_growth_index"]),
                    is_synthetic=is_synthetic
                ))
            db.session.bulk_save_objects(countries)
            db.session.commit()

        elif dataset_type == "ev_models":
            if not is_synthetic:
                EVModel.query.delete()
            models = []
            for _, r in df.iterrows():
                models.append(EVModel(
                    manufacturer=str(r["manufacturer"]),
                    model=str(r["model"]),
                    battery_capacity_kwh=float(r["battery_capacity_kwh"]),
                    max_charging_power_kw=float(r["max_charging_power_kw"]),
                    vehicle_type=str(r["vehicle_type"])
                ))
            db.session.bulk_save_objects(models)
            db.session.commit()

    @staticmethod
    def get_datasets_list():
        records = DatasetRecord.query.order_by(DatasetRecord.uploaded_at.desc()).all()
        return [r.to_dict() for r in records]

    @staticmethod
    def get_dataset_preview(dataset_id: int):
        record = DatasetRecord.query.get(dataset_id)
        if not record:
            return None
        if os.path.exists(record.file_path):
            df = pd.read_csv(record.file_path)
            return {
                "record": record.to_dict(),
                "columns": df.columns.tolist(),
                "preview": df.head(15).to_dict(orient="records"),
                "total_rows": len(df)
            }
        return None

dataset_service = DatasetService()
