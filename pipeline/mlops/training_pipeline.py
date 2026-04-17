from __future__ import annotations

from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from pipeline.anomaly_detector import AnomalyDetector, FEATURE_KEYS
from pipeline.threat_classifier import ThreatClassifier
from .ensemble_classifier import XGBoostRFEnsemble


class TrainingPipeline:
    def train_synthetic(self) -> Dict[str, Any]:
        classifier = ThreatClassifier()
        anomaly = AnomalyDetector()

        x_classifier, y_classifier = classifier._generate_synthetic_training_data()
        x_anomaly, y_anomaly = anomaly._generate_synthetic_training_dataset()

        classifier_metrics = self._evaluate_classifier(
            x_classifier,
            y_classifier,
            XGBoostRFEnsemble(),
        )
        anomaly_metrics = self._evaluate_anomaly(
            x_anomaly,
            y_anomaly,
        )

        return {
            "source_mode": "synthetic",
            "dataset_name": "synthetic_baseline",
            "dataset_family": "Synthetic",
            "classifier_bundle": {
                "model": classifier_metrics["model"],
                "scaler": classifier_metrics["scaler"],
                "label_encoder": classifier_metrics["label_encoder"],
                "training_profile": "synthetic",
            },
            "anomaly_bundle": {
                "model": anomaly_metrics["model"],
                "scaler": anomaly_metrics["scaler"],
                "training_profile": "synthetic",
            },
            "metrics": {
                "classifier": classifier_metrics["scores"],
                "anomaly": anomaly_metrics["scores"],
                "feature_keys": FEATURE_KEYS,
                "rows_trained": int(len(x_classifier)),
            },
        }

    def train_real(self, dataset_payload: Dict[str, Any]) -> Dict[str, Any]:
        features = dataset_payload["features"][FEATURE_KEYS].copy()
        labels = dataset_payload["labels"].astype(str).copy()

        classifier_metrics = self._evaluate_classifier(
            features.to_numpy(dtype="float64"),
            labels.to_numpy(dtype=str),
            XGBoostRFEnsemble(),
        )

        anomaly_target = labels.ne("normal_traffic").astype(int).to_numpy(dtype=int)
        anomaly_metrics = self._evaluate_anomaly(features.to_numpy(dtype="float64"), anomaly_target)

        return {
            "source_mode": "real",
            "dataset_name": dataset_payload["dataset_name"],
            "dataset_family": dataset_payload["dataset_family"],
            "classifier_bundle": {
                "model": classifier_metrics["model"],
                "scaler": classifier_metrics["scaler"],
                "label_encoder": classifier_metrics["label_encoder"],
                "training_profile": "real",
            },
            "anomaly_bundle": {
                "model": anomaly_metrics["model"],
                "scaler": anomaly_metrics["scaler"],
                "training_profile": "real",
            },
            "metrics": {
                "classifier": classifier_metrics["scores"],
                "anomaly": anomaly_metrics["scores"],
                "feature_keys": FEATURE_KEYS,
                "rows_trained": int(len(features)),
                "label_distribution": labels.value_counts().to_dict(),
            },
        }

    def _evaluate_classifier(self, x: np.ndarray, y: np.ndarray, estimator) -> Dict[str, Any]:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y if len(set(y)) > 1 else None,
        )

        if isinstance(estimator, XGBoostRFEnsemble):
            estimator.fit(x_train, y_train)
            predictions = estimator.predict(x_test)
            predicted_labels = estimator.label_encoder.inverse_transform(predictions)
        else:
            scaler = StandardScaler()
            x_train_scaled = scaler.fit_transform(x_train)
            x_test_scaled = scaler.transform(x_test)
            label_encoder = LabelEncoder()
            y_train_encoded = label_encoder.fit_transform(y_train)
            y_test_encoded = label_encoder.transform(y_test)

            estimator.fit(x_train_scaled, y_train_encoded)
            predicted = estimator.predict(x_test_scaled)
            predicted_labels = label_encoder.inverse_transform(predicted)

        # Calculate metrics
        accuracy = accuracy_score(y_test, predicted_labels)
        macro_f1 = f1_score(y_test, predicted_labels, average="macro", zero_division=0)
        weighted_f1 = f1_score(y_test, predicted_labels, average="weighted", zero_division=0)

        if isinstance(estimator, XGBoostRFEnsemble):
            return {
                "model": estimator,
                "scaler": estimator.scaler,
                "label_encoder": estimator.label_encoder,
                "scores": {
                    "accuracy": round(float(accuracy), 4),
                    "macro_f1": round(float(macro_f1), 4),
                    "weighted_f1": round(float(weighted_f1), 4),
                },
            }
        else:
            return {
                "model": estimator,
                "scaler": scaler,
                "label_encoder": label_encoder,
                "scores": {
                    "accuracy": round(float(accuracy), 4),
                    "macro_f1": round(float(macro_f1), 4),
                    "weighted_f1": round(float(weighted_f1), 4),
                },
            }

    def _evaluate_anomaly(self, x: np.ndarray, y_anomaly: np.ndarray) -> Dict[str, Any]:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y_anomaly,
            test_size=0.2,
            random_state=42,
            stratify=y_anomaly if len(set(y_anomaly)) > 1 else None,
        )

        scaler = StandardScaler()
        x_train_scaled = scaler.fit_transform(x_train)
        x_test_scaled = scaler.transform(x_test)

        contamination = max(0.01, min(0.2, float(np.mean(y_train)) if len(y_train) else 0.05))
        model = IsolationForest(
            n_estimators=300,
            contamination=contamination,
            random_state=42,
        )
        model.fit(x_train_scaled)
        raw_scores = model.decision_function(x_test_scaled)
        anomaly_scores = 1 / (1 + np.exp(raw_scores))
        threshold = float(np.quantile(anomaly_scores, max(0.0, 1.0 - contamination)))
        predicted = (anomaly_scores >= threshold).astype(int)

        return {
            "model": model,
            "scaler": scaler,
            "scores": {
                "precision": round(float(precision_score(y_test, predicted, zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, predicted, zero_division=0)), 4),
                "f1": round(float(f1_score(y_test, predicted, zero_division=0)), 4),
                "contamination": round(contamination, 4),
            },
        }
