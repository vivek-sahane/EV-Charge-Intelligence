"""
Canonical ML Preprocessor module for EV Charge Intelligence.
Used during training and live inference to guarantee exact feature handling and prevent leakage.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

class OutlierCapper:
    """Clips continuous features based on IQR limits computed on training data."""
    def __init__(self, factor=1.5):
        self.factor = factor
        self.bounds = {}

    def fit(self, X):
        self.bounds = {}
        for col in X.columns:
            q25 = float(X[col].quantile(0.25))
            q75 = float(X[col].quantile(0.75))
            iqr = q75 - q25
            lower = q25 - self.factor * iqr
            upper = q75 + self.factor * iqr
            self.bounds[col] = (lower, upper)
        return self

    def transform(self, X):
        X_copy = X.copy()
        for col, (lower, upper) in self.bounds.items():
            if col in X_copy.columns:
                X_copy[col] = X_copy[col].clip(lower=lower, upper=upper)
        return X_copy

    def fit_transform(self, X):
        return self.fit(X).transform(X)

class EVPreprocessor:
    """Encapsulates median imputation, IQR outlier capping, and StandardScaler."""
    def __init__(self, feature_names):
        self.feature_names = feature_names
        self.medians = {}
        self.capper = OutlierCapper()
        self.scaler = StandardScaler()

    def fit(self, df):
        X = df[self.feature_names].copy()
        for col in self.feature_names:
            self.medians[col] = float(X[col].median())
            X[col] = X[col].fillna(self.medians[col])
        
        X_capped = self.capper.fit_transform(X)
        self.scaler.fit(X_capped)
        return self

    def transform(self, df):
        # Handles both DataFrame and dict/list-of-dicts inputs
        if isinstance(df, dict):
            df = pd.DataFrame([df])
        elif isinstance(df, list):
            df = pd.DataFrame(df)
            
        X = df[self.feature_names].copy()
        for col in self.feature_names:
            median_val = self.medians.get(col, 0.0)
            X[col] = pd.to_numeric(X[col], errors="coerce").fillna(median_val)
        
        X_capped = self.capper.transform(X)
        scaled = self.scaler.transform(X_capped)
        return scaled
