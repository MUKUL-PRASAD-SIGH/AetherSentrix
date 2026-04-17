from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

from pipeline.anomaly_detector import FEATURE_KEYS


class XGBoostRFEnsemble:
    """Hybrid ensemble combining XGBoost and Random Forest for robust threat classification."""

    def __init__(
        self,
        xgb_config: Optional[Dict[str, Any]] = None,
        rf_config: Optional[Dict[str, Any]] = None,
        scaler: Optional[StandardScaler] = None,
        label_encoder: Optional[LabelEncoder] = None,
        training_profile: str = "synthetic",
    ):
        self.training_profile = training_profile
        self.xgb_config = xgb_config or {
            "n_estimators": 200,
            "max_depth": 6,
            "learning_rate": 0.1,
            "objective": "multi:softprob",
            "random_state": 42,
            "n_jobs": -1,
        }
        self.rf_config = rf_config or {
            "n_estimators": 100,
            "max_depth": 10,
            "class_weight": "balanced_subsample",
            "random_state": 42,
            "n_jobs": -1,
        }
        self.xgb_model = XGBClassifier(**self.xgb_config)
        self.rf_model = RandomForestClassifier(**self.rf_config)
        self.scaler = scaler or StandardScaler()
        self.label_encoder = label_encoder or LabelEncoder()
        self.is_trained = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """Train the ensemble models."""
        X_scaled = self.scaler.fit_transform(X)
        y_encoded = self.label_encoder.fit_transform(y)

        self.xgb_model.fit(X_scaled, y_encoded)
        self.rf_model.fit(X_scaled, y_encoded)
        self.is_trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict using ensemble voting."""
        if not self.is_trained:
            raise ValueError("Model not trained")

        X_scaled = self.scaler.transform(X)
        xgb_pred = self.xgb_model.predict(X_scaled)
        rf_pred = self.rf_model.predict(X_scaled)

        # Simple majority voting
        predictions = []
        for xgb_p, rf_p in zip(xgb_pred, rf_pred):
            votes = [xgb_p, rf_p]
            majority = max(set(votes), key=votes.count)
            predictions.append(majority)

        return np.array(predictions)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict probabilities using ensemble averaging."""
        if not self.is_trained:
            raise ValueError("Model not trained")

        X_scaled = self.scaler.transform(X)
        xgb_proba = self.xgb_model.predict_proba(X_scaled)
        rf_proba = self.rf_model.predict_proba(X_scaled)

        # Average probabilities
        return (xgb_proba + rf_proba) / 2

    def predict_batch(self, feature_vectors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch prediction with ensemble."""
        if not feature_vectors:
            return []

        X = np.array([self._features_from_dict(fv) for fv in feature_vectors])
        predictions = self.predict(X)
        probabilities = self.predict_proba(X)

        results = []
        for idx, pred in enumerate(predictions):
            threat_category = self.label_encoder.inverse_transform([pred])[0]
            max_prob = float(np.max(probabilities[idx]))
            results.append({
                "threat_category": threat_category,
                "severity": self._get_severity(threat_category),
                "risk_score": self._get_risk_score(threat_category),
                "entities": self._extract_entities(feature_vectors[idx]),
                "mitre_ids": self._get_mitre_ids(threat_category),
                "suggested_playbook": self._get_playbook(threat_category),
                "confidence": max_prob,
            })

        return results

    def _features_from_dict(self, feature_vector: Dict[str, Any]) -> List[float]:
        return [self._as_float(feature_vector.get(key), 0.0) for key in FEATURE_KEYS]

    def _get_severity(self, threat: str) -> str:
        severity_map = {
            "brute_force": "high",
            "c2_beaconing": "high",
            "ransomware": "critical",
            "data_exfiltration": "high",
            "privilege_escalation": "high",
            "malware_infection": "high",
            "sql_injection": "high",
            "ddos": "high",
            "normal_traffic": "low",
        }
        return severity_map.get(threat, "medium")

    def _get_risk_score(self, threat: str) -> float:
        risk_map = {
            "brute_force": 85.0,
            "c2_beaconing": 90.0,
            "ransomware": 95.0,
            "data_exfiltration": 88.0,
            "privilege_escalation": 92.0,
            "malware_infection": 87.0,
            "sql_injection": 80.0,
            "ddos": 75.0,
            "normal_traffic": 10.0,
        }
        return risk_map.get(threat, 50.0)

    def _extract_entities(self, feature_vector: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "user": feature_vector.get("user"),
            "host": feature_vector.get("host"),
            "source_ip": feature_vector.get("source_ip"),
            "destination_ip": feature_vector.get("destination_ip"),
        }

    def _get_mitre_ids(self, threat: str) -> List[str]:
        mitre_map = {
            "brute_force": ["T1110"],
            "c2_beaconing": ["T1071"],
            "ransomware": ["T1486"],
            "data_exfiltration": ["T1041"],
            "privilege_escalation": ["T1068", "T1548"],
            "malware_infection": ["T1189", "T1204"],
            "sql_injection": ["T1190"],
            "ddos": ["T1498"],
            "lateral_movement": ["T1021"],
            "phishing": ["T1566"],
        }
        return mitre_map.get(threat, [])

    def _get_playbook(self, threat: str) -> List[str]:
        playbook_map = {
            "brute_force": ["Review failed logins", "Lock account if confirmed malicious"],
            "c2_beaconing": ["Inspect external connections", "Block suspicious C2 host"],
            "ransomware": ["Isolate affected systems", "Restore from clean backup"],
            "data_exfiltration": ["Monitor outbound traffic", "Review data access logs"],
            "privilege_escalation": ["Audit privilege changes", "Revoke unauthorized access"],
            "malware_infection": ["Run full system scan", "Update signatures"],
            "sql_injection": ["Patch vulnerable applications", "Sanitize inputs"],
            "ddos": ["Enable DDoS protection", "Scale infrastructure"],
            "lateral_movement": ["Segment network", "Monitor internal traffic"],
            "phishing": ["Train users", "Filter suspicious emails"],
        }
        return playbook_map.get(threat, ["Investigate and respond per security policy"])

    def save_model(self, path: str) -> None:
        """Save ensemble model to disk."""
        import pickle
        with open(path, 'wb') as f:
            pickle.dump({
                'xgb_model': self.xgb_model,
                'rf_model': self.rf_model,
                'scaler': self.scaler,
                'label_encoder': self.label_encoder,
                'xgb_config': self.xgb_config,
                'rf_config': self.rf_config,
                'training_profile': self.training_profile,
                'is_trained': self.is_trained,
            }, f)

    @classmethod
    def load_model(cls, path: str) -> 'XGBoostRFEnsemble':
        """Load ensemble model from disk."""
        import pickle
        with open(path, 'rb') as f:
            data = pickle.load(f)
        instance = cls(
            xgb_config=data['xgb_config'],
            rf_config=data['rf_config'],
            scaler=data['scaler'],
            label_encoder=data['label_encoder'],
            training_profile=data['training_profile'],
        )
        instance.xgb_model = data['xgb_model']
        instance.rf_model = data['rf_model']
        instance.is_trained = data['is_trained']
        return instance

    def fine_tune(self, X: np.ndarray, y: np.ndarray, learning_rate: float = 0.01) -> None:
        """Fine-tune the ensemble with new data (transfer learning)."""
        if not self.is_trained:
            raise ValueError("Model not trained, cannot fine-tune")

        # Adjust XGBoost learning rate for fine-tuning
        self.xgb_model.set_params(learning_rate=learning_rate)
        X_scaled = self.scaler.transform(X)
        y_encoded = self.label_encoder.transform(y)

        # Fine-tune XGBoost
        self.xgb_model.fit(X_scaled, y_encoded, xgb_model=self.xgb_model)

        # Fine-tune Random Forest (limited fine-tuning possible)
        # For RF, we can update with new samples but it's not true fine-tuning
        self.rf_model.fit(X_scaled, y_encoded)

