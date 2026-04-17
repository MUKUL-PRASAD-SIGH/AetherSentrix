from __future__ import annotations

from typing import Any, Dict, Iterable, List

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler

from .anomaly_detector import FEATURE_KEYS


class ThreatClassifier:
    def __init__(self, model=None, scaler=None, label_encoder=None, training_profile: str = "synthetic"):
        self.training_profile = training_profile
        if model is None:
            self.model = RandomForestClassifier(
                n_estimators=300,
                max_depth=18,
                min_samples_leaf=2,
                min_samples_split=4,
                random_state=42,
                class_weight="balanced_subsample",
                n_jobs=1,
            )
            self.scaler = scaler or StandardScaler()
            self.label_encoder = label_encoder or LabelEncoder()
            self._train_on_synthetic_data()
        else:
            self.model = model
            self.scaler = scaler or StandardScaler()
            self.label_encoder = label_encoder or LabelEncoder()

    def _generate_synthetic_training_data(self, n_samples=5000):
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
            samples_per_threat = n_samples // len(threat_types)
            for _ in range(samples_per_threat):
                features.append(self._sample_for_threat(threat))
                labels.append(threat)

        return np.array(features), np.array(labels)

    def _sample_for_threat(self, threat: str) -> List[float]:
        if threat == "normal_traffic":
            sample = [1.0, 0.05, 3600, 1000000, 5, 0.1, 0.0, 0.0, 0.8]
            noise = [0.3, 0.02, 600, 200000, 2, 0.05, 0.1, 0.1, 0.1]
        elif threat == "brute_force":
            sample = [15.0, 0.8, 300, 10000, 1, 0.9, 2.0, 0.1, 0.3]
            noise = [3.0, 0.1, 100, 5000, 0.5, 0.1, 0.5, 0.05, 0.1]
        elif threat == "c2_beaconing":
            sample = [0.5, 0.0, 1800, 50000, 1, 0.7, 1.5, 0.9, 0.4]
            noise = [0.2, 0.01, 300, 10000, 0.5, 0.1, 0.3, 0.05, 0.1]
        elif threat == "lateral_movement":
            sample = [3.0, 0.2, 1200, 200000, 8, 0.6, 1.2, 0.3, 0.5]
            noise = [1.0, 0.1, 300, 50000, 3, 0.1, 0.3, 0.1, 0.1]
        elif threat == "data_exfiltration":
            sample = [1.0, 0.0, 2400, 50000000, 3, 0.8, 1.8, 0.2, 0.6]
            noise = [0.3, 0.01, 600, 10000000, 1, 0.1, 0.4, 0.1, 0.1]
        else:
            sample = [2.0, 0.1, 1800, 500000, 4, 0.5, 1.0, 0.4, 0.7]
            noise = [0.8, 0.05, 400, 100000, 2, 0.15, 0.3, 0.2, 0.1]

        return [float(np.random.normal(mean, std)) for mean, std in zip(sample, noise)]

    def _train_on_synthetic_data(self):
        try:
            x_train, y_train = self._generate_synthetic_training_data()
            x_scaled = self.scaler.fit_transform(x_train)
            y_encoded = self.label_encoder.fit_transform(y_train)
            self.model.fit(x_scaled, y_encoded)
        except Exception as e:
            print(f"ML training failed, using fallback: {e}")

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

        try:
            x = np.array([self._features_from_dict(feature_vector) for feature_vector in feature_vectors])
            x_scaled = self.scaler.transform(x)
            prediction_encoded = self.model.predict(x_scaled)
            predictions = self.label_encoder.inverse_transform(prediction_encoded)
            probabilities = self.model.predict_proba(x_scaled)

            results = []
            for index, prediction in enumerate(predictions):
                max_prob = float(np.max(probabilities[index]))
                results.append(self._format_prediction(feature_vectors[index], prediction, max_prob))
            return results
        except Exception:
            return [self._rule_based_predict(feature_vector) for feature_vector in feature_vectors]

    def _features_from_dict(self, feature_vector: Dict[str, Any]) -> List[float]:
        return [self._as_float(feature_vector.get(key), 0.0) for key in FEATURE_KEYS]

    def _format_prediction(self, feature_vector: Dict[str, Any], prediction: str, confidence: float) -> Dict[str, Any]:
        return {
            "threat_category": prediction,
            "severity": self._get_severity(prediction),
            "risk_score": self._get_risk_score(prediction),
            "entities": self._extract_entities(feature_vector),
            "mitre_ids": self._get_mitre_ids(prediction),
            "suggested_playbook": self._get_playbook(prediction),
            "confidence": confidence,
        }

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
        mitre_ids = []
        suggested_playbook = []

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

        return {
            "threat_category": threat_category,
            "severity": severity,
            "risk_score": risk_score,
            "entities": self._extract_entities(feature_vector),
            "mitre_ids": mitre_ids,
            "suggested_playbook": suggested_playbook,
            "confidence": 0.5 if threat_category != "unknown" else 0.2,
        }

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
            "brute_force": ["Review failed logins", "Lock account if confirmed malicious", "Enable MFA"],
            "c2_beaconing": ["Inspect external connections", "Block suspicious C2 host", "Isolate affected systems"],
            "ransomware": ["Disconnect from network", "Restore from backup", "Pay ransom only as last resort"],
            "data_exfiltration": ["Block outbound connections", "Audit data access logs", "Notify legal/compliance"],
            "privilege_escalation": ["Review user permissions", "Implement least privilege", "Monitor for anomalous access"],
            "malware_infection": ["Quarantine affected systems", "Run full antivirus scan", "Update signatures"],
            "sql_injection": ["Sanitize user inputs", "Use prepared statements", "Implement WAF"],
            "ddos": ["Enable DDoS protection", "Scale infrastructure", "Filter malicious traffic"],
            "lateral_movement": ["Monitor network traffic", "Implement network segmentation", "Review authentication logs"],
            "phishing": ["Train users on phishing awareness", "Implement email filtering", "Verify suspicious emails"],
        }
        return playbook_map.get(threat, ["Investigate alert details", "Follow incident response procedures"])

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
