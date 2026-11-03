"""
EV Charge Intelligence - Machine Learning Model Training Pipeline
Trains GradientBoostingRegressor models for:
1. EV Demand Prediction
2. Country Growth Prediction

Saves serialized artifacts in backend/models/
"""
import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Add backend to sys.path to enable canonical module pickling
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ml.preprocessor import EVPreprocessor

DATASET_DIR = os.path.join(PROJECT_ROOT, "datasets", "sample")
BACKEND_MODEL_DIR = os.path.join(BACKEND_DIR, "models")
os.makedirs(BACKEND_MODEL_DIR, exist_ok=True)

RANDOM_STATE = 42

def train_demand_model():
    print("--- Training EV Demand Prediction Model ---")
    file_path = os.path.join(DATASET_DIR, "charging_stations.csv")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Missing dataset at {file_path}")

    df = pd.read_csv(file_path)
    features = [
        "station_count", "port_count", "fast_station_share", 
        "fast_port_share", "median_power_kw"
    ]
    target = "demand_score"

    for f in features + [target]:
        if f not in df.columns:
            raise ValueError(f"Required column '{f}' missing from charging stations dataset.")

    X = df[features]
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE
    )

    preprocessor = EVPreprocessor(features)
    preprocessor.fit(X_train)
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    model = GradientBoostingRegressor(
        n_estimators=160,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=RANDOM_STATE
    )
    model.fit(X_train_proc, y_train)

    preds_test = model.predict(X_test_proc)
    r2 = float(r2_score(y_test, preds_test))
    mae = float(mean_absolute_error(y_test, preds_test))
    mse = float(mean_squared_error(y_test, preds_test))
    rmse = float(np.sqrt(mse))

    importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(features, model.feature_importances_)
    }

    sample_size = min(30, len(y_test))
    indices = np.random.RandomState(RANDOM_STATE).choice(len(y_test), sample_size, replace=False)
    actual_vs_predicted = [
        {"actual": round(float(y_test.iloc[idx]), 2), "predicted": round(float(preds_test[idx]), 2)}
        for idx in indices
    ]

    print(f"Demand Model Results: R2={r2:.4f}, MAE={mae:.4f}, RMSE={rmse:.4f}")

    joblib.dump(model, os.path.join(BACKEND_MODEL_DIR, "demand_model.joblib"))
    joblib.dump(preprocessor, os.path.join(BACKEND_MODEL_DIR, "demand_preprocessor.joblib"))

    return {
        "model_name": "demand_prediction",
        "version": "1.0.0",
        "features": features,
        "target": target,
        "r2_score": round(r2, 4),
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "feature_importances": importances,
        "actual_vs_predicted": actual_vs_predicted,
        "n_samples_train": len(X_train),
        "n_samples_test": len(X_test),
        "trained_at": datetime.now(timezone.utc).isoformat()
    }

def train_growth_model():
    print("--- Training Country Growth Prediction Model ---")
    file_path = os.path.join(DATASET_DIR, "country_growth.csv")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Missing dataset at {file_path}")

    df = pd.read_csv(file_path)
    features = ["station_count", "port_count", "fast_station_share", "median_power_kw"]
    target = "future_growth_index"

    for f in features + [target]:
        if f not in df.columns:
            raise ValueError(f"Required column '{f}' missing from country growth dataset.")

    X = df[features]
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE
    )

    preprocessor = EVPreprocessor(features)
    preprocessor.fit(X_train)
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    model = GradientBoostingRegressor(
        n_estimators=180,
        learning_rate=0.07,
        max_depth=4,
        subsample=0.85,
        random_state=RANDOM_STATE
    )
    model.fit(X_train_proc, y_train)

    preds_test = model.predict(X_test_proc)
    r2 = float(r2_score(y_test, preds_test))
    mae = float(mean_absolute_error(y_test, preds_test))
    mse = float(mean_squared_error(y_test, preds_test))
    rmse = float(np.sqrt(mse))

    importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(features, model.feature_importances_)
    }

    sample_size = min(25, len(y_test))
    indices = np.random.RandomState(RANDOM_STATE).choice(len(y_test), sample_size, replace=False)
    actual_vs_predicted = [
        {"actual": round(float(y_test.iloc[idx]), 2), "predicted": round(float(preds_test[idx]), 2)}
        for idx in indices
    ]

    print(f"Growth Model Results: R2={r2:.4f}, MAE={mae:.4f}, RMSE={rmse:.4f}")

    joblib.dump(model, os.path.join(BACKEND_MODEL_DIR, "growth_model.joblib"))
    joblib.dump(preprocessor, os.path.join(BACKEND_MODEL_DIR, "growth_preprocessor.joblib"))

    return {
        "model_name": "country_growth_prediction",
        "version": "1.0.0",
        "features": features,
        "target": target,
        "r2_score": round(r2, 4),
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "feature_importances": importances,
        "actual_vs_predicted": actual_vs_predicted,
        "n_samples_train": len(X_train),
        "n_samples_test": len(X_test),
        "trained_at": datetime.now(timezone.utc).isoformat()
    }

def main():
    demand_meta = train_demand_model()
    growth_meta = train_growth_model()

    metadata = {
        "models": {
            "demand_prediction": demand_meta,
            "country_growth_prediction": growth_meta
        },
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "training_environment": {
            "scikit_learn_version": "1.5.2+",
            "random_state": RANDOM_STATE
        }
    }

    meta_file = os.path.join(BACKEND_MODEL_DIR, "model_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nTraining complete! Artifacts & metadata saved to {BACKEND_MODEL_DIR}")

if __name__ == "__main__":
    main()
