import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

DATASET_PATH = "data/datasets/cicids2017_final.csv"
MODEL_DIR = "data/model_registry"

def ensure_model_dir():
    os.makedirs(MODEL_DIR, exist_ok=True)

def train_and_save():
    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    df = df.sample(n=min(5000, len(df)), random_state=42)

    # Clean data (drop unnamed index if exists)
    if 'Unnamed: 0' in df.columns:
        df = df.drop(columns=['Unnamed: 0'])
    
    # Check for labels
    if 'label' not in df.columns:
        raise ValueError("Column 'label' not found in dataset!")

    y = df['label']
    X = df.drop(columns=['label'])

    print(f"Training data shape: {X.shape}")

    # 1. Train Isolation Forest (unsupervised)
    print("Training Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    iso_forest.fit(X)
    iso_model_path = os.path.join(MODEL_DIR, "iso_forest_v1.pkl")
    joblib.dump(iso_forest, iso_model_path)
    print(f"Saved Isolation Forest to {iso_model_path}")

    # 2. Train Ensemble Classifier (XGBoost + Random Forest)
    print("Training XGBoost + Random Forest Ensemble...")
    if y.dtype == object:
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        mapping = dict(zip(le.classes_, le.transform(le.classes_)))
        print(f"Label Mapping: {mapping}")
    else:
        y_encoded = y

    from pipeline.mlops.ensemble_classifier import XGBoostRFEnsemble
    ensemble = XGBoostRFEnsemble()
    
    # We pass the pandas DataFrame values directly, avoiding warning loops in sklearn.
    ensemble.fit(X.values, y_encoded)
    
    ensemble_path = os.path.join(MODEL_DIR, "xgboost_rf_ensemble_v1.pkl")
    ensemble.save_model(ensemble_path)
    print(f"Saved Full Ensemble to {ensemble_path}")

    # 3. Save feature columns for validation during inference
    feature_cols = X.columns.tolist()
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "feature_columns.pkl"))
    print("Training Complete!")

if __name__ == "__main__":
    ensure_model_dir()
    train_and_save()
