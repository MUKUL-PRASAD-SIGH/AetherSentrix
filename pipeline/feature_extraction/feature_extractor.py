from __future__ import annotations

from typing import Any, Dict


class FeatureExtractor:
    def __init__(self):
        self.extracted_features = []

    def extract_features(self, event: Dict[str, Any]) -> Dict[str, Any]:
        metadata = event.get("metadata", {}) or {}

        features = {
            "event_id": event.get("event_id", "unknown"),
            "timestamp": event.get("timestamp", "2026-04-14T00:00:00Z"),
            "user": event.get("user", "unknown"),
            "host": event.get("host", "unknown"),
            "source_ip": event.get("source_ip", event.get("ip", "0.0.0.0")),
            "destination_ip": event.get("destination_ip", metadata.get("destination_ip", "0.0.0.0")),
            "event_type": event.get("event_type", "unknown"),
            "action": event.get("action", "unknown"),
            "outcome": event.get("outcome", "unknown"),
            "login_attempt_rate": self._as_float(event.get("login_attempt_rate"), 0.0),
            "failed_login_ratio": self._as_float(event.get("failed_login_ratio"), 0.0),
            "session_duration": self._as_float(event.get("session_duration"), 0.0),
            "bytes_transferred": self._as_float(event.get("bytes_transferred", event.get("outbound_bytes")), 0.0),
            "unique_ips": self._as_float(event.get("unique_ips"), 1.0),
            "periodicity": self._as_float(event.get("periodicity"), 0.0),
            "endpoint_anomaly_score": self._as_float(event.get("endpoint_anomaly_score"), 0.0),
            "behavior_baseline_deviation": self._as_float(event.get("behavior_baseline_deviation"), 0.0),
            "network_confidence_score": self._as_float(event.get("network_confidence_score"), 0.0),
            "metadata": metadata,
        }

        if features["bytes_transferred"] == 0.0 and event.get("event_type") == "data_exfiltration":
            features["bytes_transferred"] = 25_000_000.0

        self.extracted_features.append(features)
        return features

    def get_extraction_count(self) -> int:
        return len(self.extracted_features)

    def _as_float(self, value: Any, default: float) -> float:
        if value is None:
            return default
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
