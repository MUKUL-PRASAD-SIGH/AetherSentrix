from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

import numpy as np

from pipeline.feature_schema import FEATURE_KEYS
from pipeline.mlops.neuromorphic_models import (
    NeuromorphicAnomalyDetector,
)


class AnomalyDetector:
    def __init__(
        self,
        model: Optional[Any] = None,
        scaler: Optional[Any] = None,
        training_profile: str = "synthetic",
    ):
        self.training_profile = training_profile
        self.neuromorphic = model if isinstance(model, NeuromorphicAnomalyDetector) else None

        if self.neuromorphic is None:
            self.neuromorphic = NeuromorphicAnomalyDetector(
                feature_keys=FEATURE_KEYS,
                model=model,
                feature_scaler=scaler,
                training_profile=training_profile,
            )
            self._train_on_synthetic_data()

    def fit(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> "AnomalyDetector":
        self.neuromorphic.fit(X, y)
        return self

    def _generate_synthetic_training_dataset(self, n_samples: int = 6000):
        np.random.seed(42)
        normal_data = []

        for _ in range(n_samples // 3):
            normal_data.append(
                {
                    "login_attempt_rate": np.random.normal(1.0, 0.3),
                    "failed_login_ratio": np.random.normal(0.05, 0.02),
                    "session_duration": np.random.normal(3600, 600),
                    "bytes_transferred": np.random.normal(1000000, 200000),
                    "unique_ips": np.random.normal(5, 2),
                    "endpoint_anomaly_score": np.random.normal(0.1, 0.05),
                    "behavior_baseline_deviation": np.random.normal(0.0, 0.1),
                    "periodicity": np.random.normal(0.05, 0.08),
                    "network_confidence_score": np.random.normal(0.85, 0.08),
                }
            )

        for _ in range(n_samples // 3):
            normal_data.append(
                {
                    "login_attempt_rate": np.random.normal(0.5, 0.2),
                    "failed_login_ratio": np.random.normal(0.01, 0.01),
                    "session_duration": np.random.normal(1800, 300),
                    "bytes_transferred": np.random.normal(500000, 100000),
                    "unique_ips": np.random.normal(2, 1),
                    "endpoint_anomaly_score": np.random.normal(0.05, 0.03),
                    "behavior_baseline_deviation": np.random.normal(0.0, 0.05),
                    "periodicity": np.random.normal(0.0, 0.05),
                    "network_confidence_score": np.random.normal(0.9, 0.04),
                }
            )

        anomalous_data = []
        for _ in range(n_samples // 6):
            anomalous_data.append(
                {
                    "login_attempt_rate": np.random.normal(15.0, 3.0),
                    "failed_login_ratio": np.random.normal(0.8, 0.1),
                    "session_duration": np.random.normal(300, 100),
                    "bytes_transferred": np.random.normal(10000, 5000),
                    "unique_ips": np.random.normal(1, 0.5),
                    "endpoint_anomaly_score": np.random.normal(0.9, 0.1),
                    "behavior_baseline_deviation": np.random.normal(2.0, 0.5),
                    "periodicity": np.random.normal(0.75, 0.1),
                    "network_confidence_score": np.random.normal(0.3, 0.1),
                }
            )

        burst_anomalies = []
        for _ in range(n_samples // 6):
            burst_anomalies.append(
                {
                    "login_attempt_rate": np.random.normal(7.0, 1.5),
                    "failed_login_ratio": np.random.normal(0.45, 0.08),
                    "session_duration": np.random.normal(900, 200),
                    "bytes_transferred": np.random.normal(12000000, 3000000),
                    "unique_ips": np.random.normal(12, 3),
                    "endpoint_anomaly_score": np.random.normal(0.7, 0.08),
                    "behavior_baseline_deviation": np.random.normal(1.3, 0.3),
                    "periodicity": np.random.normal(0.9, 0.05),
                    "network_confidence_score": np.random.normal(0.45, 0.1),
                }
            )

        all_data = normal_data + anomalous_data + burst_anomalies
        labels = ([0] * len(normal_data)) + ([1] * len(anomalous_data)) + ([1] * len(burst_anomalies))
        return np.array([self._features_from_dict(sample) for sample in all_data]), np.array(labels)

    def _generate_synthetic_training_data(self, n_samples: int = 6000):
        data, _ = self._generate_synthetic_training_dataset(n_samples=n_samples)
        return data

    def _train_on_synthetic_data(self):
        try:
            x_train, y_train = self._generate_synthetic_training_dataset()
            self.fit(x_train, y_train)
        except Exception:
            # The detector falls back to heuristic scoring if training artifacts are unavailable.
            self.neuromorphic.is_trained = False

    def score(self, feature_vector: Dict[str, Any]) -> float:
        return self.score_batch([feature_vector])[0]

    def score_batch(self, feature_vectors: Iterable[Dict[str, Any]]) -> List[float]:
        feature_vectors = list(feature_vectors)
        if not feature_vectors:
            return []

        if getattr(self.neuromorphic, "is_trained", False):
            try:
                return self.neuromorphic.score_batch_from_dicts(feature_vectors)
            except Exception:
                pass

        return [self._fallback_score(feature_vector) for feature_vector in feature_vectors]

    def predict(self, features: Any) -> float:
        if isinstance(features, dict):
            return self.score(features)
        if isinstance(features, list):
            return self.score(self._coerce_to_feature_dict(features))
        return 0.0

    def _features_from_dict(self, feature_vector: Dict[str, Any]) -> List[float]:
        return [self._as_float(feature_vector.get(key), 0.0) for key in FEATURE_KEYS]

    def _fallback_score(self, feature_vector: Dict[str, Any]) -> float:
        endpoint_score = self._as_float(feature_vector.get("endpoint_anomaly_score"), 0.0)
        baseline_deviation = self._as_float(feature_vector.get("behavior_baseline_deviation"), 0.0)
        periodicity = self._as_float(feature_vector.get("periodicity"), 0.0)
        bytes_transferred = self._as_float(feature_vector.get("bytes_transferred"), 0.0)
        transfer_pressure = min(1.0, bytes_transferred / 50_000_000.0)
        return min(
            1.0,
            max(
                0.0,
                (endpoint_score * 0.45)
                + (baseline_deviation * 0.25)
                + (periodicity * 0.2)
                + (transfer_pressure * 0.1),
            ),
        )

    def _coerce_to_feature_dict(self, values: List[Any]) -> Dict[str, float]:
        flat_values = []
        for item in values:
            if isinstance(item, (int, float)):
                flat_values.append(item)
            elif isinstance(item, list):
                flat_values.extend([x for x in item if isinstance(x, (int, float))])
        return {
            key: float(flat_values[index]) if index < len(flat_values) else 0.0
            for index, key in enumerate(FEATURE_KEYS)
        }

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
