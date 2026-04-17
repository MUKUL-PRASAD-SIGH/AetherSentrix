from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler

from .feature_schema import FEATURE_KEYS
from .mlops.ensemble_classifier import XGBoostRFEnsemble
from .mlops.neuromorphic_models import NeuromorphicHybridClassifier


class ThreatClassifier:
    def __init__(
        self,
        model: Optional[Any] = None,
        scaler: Optional[Any] = None,
        label_encoder: Optional[Any] = None,
        training_profile: str = "synthetic",
    ):
        self.training_profile = training_profile
        self.hybrid_model = model if isinstance(model, NeuromorphicHybridClassifier) else None

        if self.hybrid_model is None:
            if model is None:
                base_ensemble = XGBoostRFEnsemble()
            elif isinstance(model, XGBoostRFEnsemble):
                base_ensemble = model
            else:
                base_ensemble = self._wrap_legacy_model(
                    model=model,
                    scaler=scaler,
                    label_encoder=label_encoder,
                )

            self.hybrid_model = NeuromorphicHybridClassifier(
                feature_keys=FEATURE_KEYS,
                ensemble=base_ensemble,
                training_profile=training_profile,
            )
            self._train_on_synthetic_data()

    def fit(self, X: np.ndarray, y: np.ndarray) -> "ThreatClassifier":
        self.hybrid_model.fit(X, y)
        return self

    def _generate_synthetic_training_data(self, n_samples: int = 3600):
        np.random.seed(42)
        features = []
        labels = []

        threat_types = [
            "normal_traffic",
            "brute_force",
            "c2_beaconing",
            "lateral_movement",
            "data_exfiltration",
            "privilege_escalation",
            "malware_infection",
            "phishing",
            "sql_injection",
            "xss",
            "ddos",
            "ransomware",
        ]

        for threat in threat_types:
            samples_per_threat = max(48, n_samples // len(threat_types))
            for _ in range(samples_per_threat):
                features.append(self._sample_for_threat(threat))
                labels.append(threat)

        return np.array(features), np.array(labels)

    def _sample_for_threat(self, threat: str) -> List[float]:
        if threat == "normal_traffic":
            sample = [1.0, 0.05, 3600, 1000000, 5, 0.1, 0.0, 0.0, 0.8]
            noise = [0.3, 0.02, 600, 200000, 2, 0.05, 0.1, 0.08, 0.08]
        elif threat == "brute_force":
            sample = [15.0, 0.8, 300, 10000, 1, 0.9, 2.0, 0.2, 0.3]
            noise = [3.0, 0.1, 100, 5000, 0.5, 0.1, 0.5, 0.06, 0.1]
        elif threat == "c2_beaconing":
            sample = [0.5, 0.0, 1800, 50000, 1, 0.7, 1.5, 0.9, 0.4]
            noise = [0.2, 0.01, 300, 10000, 0.5, 0.1, 0.3, 0.04, 0.1]
        elif threat == "lateral_movement":
            sample = [3.0, 0.2, 1200, 200000, 8, 0.6, 1.2, 0.3, 0.5]
            noise = [1.0, 0.1, 300, 50000, 3, 0.1, 0.3, 0.1, 0.1]
        elif threat == "data_exfiltration":
            sample = [1.0, 0.0, 2400, 50000000, 3, 0.8, 1.8, 0.2, 0.6]
            noise = [0.3, 0.01, 600, 10000000, 1, 0.1, 0.4, 0.08, 0.1]
        elif threat == "privilege_escalation":
            sample = [4.0, 0.3, 900, 300000, 4, 0.75, 1.6, 0.45, 0.45]
            noise = [0.7, 0.07, 250, 60000, 1.0, 0.1, 0.25, 0.1, 0.08]
        elif threat == "ransomware":
            sample = [2.0, 0.12, 1200, 9000000, 2, 0.95, 2.2, 0.65, 0.35]
            noise = [0.5, 0.04, 180, 2000000, 0.6, 0.05, 0.25, 0.1, 0.08]
        else:
            sample = [2.0, 0.1, 1800, 500000, 4, 0.5, 1.0, 0.4, 0.7]
            noise = [0.8, 0.05, 400, 100000, 2, 0.15, 0.3, 0.2, 0.1]

        return [float(np.random.normal(mean, std)) for mean, std in zip(sample, noise)]

    def _train_on_synthetic_data(self):
        try:
            x_train, y_train = self._generate_synthetic_training_data()
            self.fit(x_train, y_train)
        except Exception:
            self.hybrid_model.is_trained = False

    def predict(self, feature_vector: Any) -> Any:
        if isinstance(feature_vector, dict):
            return self.predict_batch([feature_vector])[0]
        if isinstance(feature_vector, list):
            return self.predict(self._coerce_to_feature_dict(feature_vector))
        return "unknown"

    def predict_batch(self, feature_vectors: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        feature_vectors = list(feature_vectors)
        if not feature_vectors:
            return []

        if getattr(self.hybrid_model, "is_trained", False):
            try:
                return self.hybrid_model.predict_batch(feature_vectors)
            except Exception:
                pass

        return [self._rule_based_predict(feature_vector) for feature_vector in feature_vectors]

    def _coerce_to_feature_dict(self, values: List[Any]) -> Dict[str, float]:
        if len(values) == 1 and isinstance(values[0], list):
            values = values[0]
        return {
            key: self._as_float(values[index], 0.0) if index < len(values) else 0.0
            for index, key in enumerate(FEATURE_KEYS)
        }

    def _rule_based_predict(self, feature_vector: Dict[str, Any]) -> Dict[str, Any]:
        threat_category = "unknown"
        severity = "low"
        risk_score = 0.0
        mitre_ids: List[str] = []
        suggested_playbook: List[str] = []

        if feature_vector.get("login_attempt_rate", 0) > 5 or feature_vector.get("failed_login_ratio", 0) > 0.5:
            threat_category = "brute_force"
            severity = "high"
            risk_score = 85.0
            mitre_ids = ["T1110"]
            suggested_playbook = ["Review failed logins", "Lock account if confirmed malicious"]

        if feature_vector.get("periodicity", 0) > 0.8:
            threat_category = "c2_beaconing"
            severity = "high"
            risk_score = 90.0
            mitre_ids = ["T1071"]
            suggested_playbook = ["Inspect external connections", "Block suspicious C2 host"]

        if feature_vector.get("bytes_transferred", 0) > 20_000_000:
            threat_category = "data_exfiltration"
            severity = "high"
            risk_score = 88.0
            mitre_ids = ["T1041"]
            suggested_playbook = ["Block outbound connections", "Audit sensitive data access"]

        return {
            "threat_category": threat_category,
            "severity": severity,
            "risk_score": risk_score,
            "entities": self._extract_entities(feature_vector),
            "mitre_ids": mitre_ids,
            "suggested_playbook": suggested_playbook,
            "confidence": 0.55 if threat_category != "unknown" else 0.2,
            "model_family": "rule_fallback",
        }

    def _extract_entities(self, feature_vector: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "user": feature_vector.get("user"),
            "host": feature_vector.get("host"),
            "source_ip": feature_vector.get("source_ip"),
            "destination_ip": feature_vector.get("destination_ip"),
        }

    def _wrap_legacy_model(self, model: Any, scaler: Any, label_encoder: Any) -> XGBoostRFEnsemble:
        if isinstance(model, RandomForestClassifier):
            ensemble = XGBoostRFEnsemble(
                scaler=scaler or StandardScaler(),
                label_encoder=label_encoder or LabelEncoder(),
                training_profile=self.training_profile,
            )
            ensemble.xgb_model = None
            ensemble.rf_model = model
            ensemble.is_trained = True
            return ensemble
        if isinstance(model, XGBoostRFEnsemble):
            return model
        return XGBoostRFEnsemble()

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
