from __future__ import annotations

from typing import Any, Dict

import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from pipeline.anomaly_detector import AnomalyDetector, FEATURE_KEYS
from pipeline.threat_classifier import ThreatClassifier
from .neuromorphic_models import default_architecture_summary


class TrainingPipeline:
    def train_synthetic(self) -> Dict[str, Any]:
        classifier_template = ThreatClassifier()
        anomaly_template = AnomalyDetector()

        x_classifier, y_classifier = classifier_template._generate_synthetic_training_data()
        x_anomaly, y_anomaly = anomaly_template._generate_synthetic_training_dataset()

        classifier_metrics = self._evaluate_classifier(x_classifier, y_classifier)
        anomaly_metrics = self._evaluate_anomaly(x_anomaly, y_anomaly)
        architecture = default_architecture_summary()

        return {
            "source_mode": "synthetic",
            "dataset_name": "synthetic_baseline",
            "dataset_family": "Synthetic",
            "classifier_bundle": {
                "model": classifier_metrics["model"],
                "scaler": getattr(classifier_metrics["model"].hybrid_model.ensemble, "scaler", None),
                "label_encoder": getattr(classifier_metrics["model"].hybrid_model.ensemble, "label_encoder", None),
                "training_profile": "synthetic",
            },
            "anomaly_bundle": {
                "model": anomaly_metrics["model"],
                "scaler": getattr(anomaly_metrics["model"].neuromorphic, "feature_scaler", None),
                "training_profile": "synthetic",
            },
            "metrics": {
                "classifier": classifier_metrics["scores"],
                "anomaly": anomaly_metrics["scores"],
                "feature_keys": FEATURE_KEYS,
                "rows_trained": int(len(x_classifier)),
                "architectures": architecture.__dict__,
            },
        }

    def train_real(self, dataset_payload: Dict[str, Any]) -> Dict[str, Any]:
        features = dataset_payload["features"][FEATURE_KEYS].copy().to_numpy(dtype="float64")
        labels = dataset_payload["labels"].astype(str).copy().to_numpy(dtype=str)

        classifier_metrics = self._evaluate_classifier(features, labels)

        anomaly_target = (labels != "normal_traffic").astype(int)
        anomaly_metrics = self._evaluate_anomaly(features, anomaly_target)
        architecture = default_architecture_summary()

        return {
            "source_mode": "real",
            "dataset_name": dataset_payload["dataset_name"],
            "dataset_family": dataset_payload["dataset_family"],
            "classifier_bundle": {
                "model": classifier_metrics["model"],
                "scaler": getattr(classifier_metrics["model"].hybrid_model.ensemble, "scaler", None),
                "label_encoder": getattr(classifier_metrics["model"].hybrid_model.ensemble, "label_encoder", None),
                "training_profile": "real",
            },
            "anomaly_bundle": {
                "model": anomaly_metrics["model"],
                "scaler": getattr(anomaly_metrics["model"].neuromorphic, "feature_scaler", None),
                "training_profile": "real",
            },
            "metrics": {
                "classifier": classifier_metrics["scores"],
                "anomaly": anomaly_metrics["scores"],
                "feature_keys": FEATURE_KEYS,
                "rows_trained": int(len(features)),
                "label_distribution": {
                    label: int(count) for label, count in zip(*np.unique(labels, return_counts=True))
                },
                "architectures": architecture.__dict__,
            },
        }

    def _evaluate_classifier(self, x: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y if len(set(y)) > 1 else None,
        )

        classifier = ThreatClassifier(model=None, training_profile="evaluated")
        classifier.fit(x_train, y_train)
        predictions = classifier.hybrid_model.predict(x_test)

        accuracy = accuracy_score(y_test, predictions)
        macro_f1 = f1_score(y_test, predictions, average="macro", zero_division=0)
        weighted_f1 = f1_score(y_test, predictions, average="weighted", zero_division=0)

        return {
            "model": classifier,
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

        detector = AnomalyDetector(model=None, training_profile="evaluated")
        detector.fit(x_train, y_train)
        results = detector.neuromorphic.detect(x_test)
        predicted = results["is_anomaly"].astype(int)

        return {
            "model": detector,
            "scores": {
                "precision": round(float(precision_score(y_test, predicted, zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, predicted, zero_division=0)), 4),
                "f1": round(float(f1_score(y_test, predicted, zero_division=0)), 4),
                "contamination": round(float(detector.neuromorphic.contamination), 4),
                "threshold": round(float(detector.neuromorphic.threshold), 4),
            },
        }
