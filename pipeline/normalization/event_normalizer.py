from __future__ import annotations

from typing import Any, Dict, List


class EventNormalizer:
    def __init__(self):
        self.normalized_events = []

    def normalize(self, raw_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for event in raw_events:
            normalized_event = self.normalize_event(event)
            normalized.append(normalized_event)
            self.normalized_events.append(normalized_event)
        return normalized

    def normalize_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        metadata = event.get("metadata", {}) or {}
        event_type = event.get("event_type", "unknown")
        outcome = event.get("outcome", "unknown")

        normalized = {
            "event_id": event.get("event_id", "unknown"),
            "timestamp": event.get("timestamp", "2026-04-14T00:00:00Z"),
            "source_layer": event.get("source_layer", "unknown"),
            "host": event.get("host", metadata.get("host", "unknown")),
            "user": event.get("user", metadata.get("user", "unknown")),
            "source_ip": event.get("source_ip", event.get("ip", metadata.get("source_ip", "0.0.0.0"))),
            "destination_ip": event.get("destination_ip", metadata.get("destination_ip", metadata.get("remote_ip", "0.0.0.0"))),
            "event_type": event_type,
            "action": event.get("action", metadata.get("action", "unknown")),
            "outcome": outcome,
            "bytes_transferred": self._derive_bytes_transferred(event_type, metadata, event),
            "session_duration": self._derive_session_duration(event_type, metadata, event),
            "login_attempt_rate": self._derive_login_attempt_rate(event_type, metadata, event),
            "failed_login_ratio": self._derive_failed_login_ratio(event_type, outcome, metadata, event),
            "unique_ips": self._derive_unique_ips(event_type, metadata, event),
            "periodicity": self._derive_periodicity(event_type, metadata, event),
            "endpoint_anomaly_score": self._derive_endpoint_score(event_type, metadata),
            "behavior_baseline_deviation": self._derive_baseline_deviation(event_type, metadata),
            "network_confidence_score": self._derive_network_confidence(event_type, metadata),
            "metadata": metadata,
        }
        return normalized

    def get_normalized_count(self) -> int:
        return len(self.normalized_events)

    def _derive_bytes_transferred(self, event_type: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("bytes_transferred", event.get("outbound_bytes", metadata.get("bytes_transferred", metadata.get("size"))))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type in {"data_exfiltration", "data_collection"}:
            return 25_000_000.0
        if event_type in {"c2_beacon", "c2_communication", "c2_beaconing"}:
            return 75_000.0
        if event_type in {"malware_delivery", "malicious_file_download"}:
            return 5_000_000.0
        return 0.0

    def _derive_session_duration(self, event_type: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("session_duration", metadata.get("session_duration"))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type in {"brute_force", "credential_theft"}:
            return 180.0
        if event_type in {"lateral_movement", "privilege_escalation"}:
            return 900.0
        if event_type in {"data_exfiltration", "c2_beacon", "c2_communication"}:
            return 2400.0
        return 1200.0

    def _derive_login_attempt_rate(self, event_type: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("login_attempt_rate", metadata.get("attempts_per_minute", metadata.get("attempts")))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type == "brute_force":
            return 12.0
        if event_type in {"successful_login", "credential_capture"}:
            return 2.0
        return 0.5

    def _derive_failed_login_ratio(self, event_type: str, outcome: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("failed_login_ratio", metadata.get("failed_login_ratio"))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type == "brute_force":
            return 0.85
        if "fail" in str(outcome).lower():
            return 1.0
        return 0.0

    def _derive_unique_ips(self, event_type: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("unique_ips", metadata.get("unique_ips"))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type == "lateral_movement":
            return 6.0
        if event_type == "brute_force":
            return 3.0
        return 1.0

    def _derive_periodicity(self, event_type: str, metadata: Dict[str, Any], event: Dict[str, Any]) -> float:
        explicit = event.get("periodicity", metadata.get("periodicity"))
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        if event_type in {"c2_beacon", "c2_communication", "c2_beaconing"}:
            return 0.95
        return 0.1

    def _derive_endpoint_score(self, event_type: str, metadata: Dict[str, Any]) -> float:
        explicit = metadata.get("endpoint_anomaly_score")
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        score_map = {
            "brute_force": 0.9,
            "lateral_movement": 0.7,
            "data_exfiltration": 0.8,
            "c2_beacon": 0.75,
            "c2_communication": 0.75,
            "privilege_escalation": 0.8,
            "malware_execution": 0.85,
        }
        return score_map.get(event_type, 0.2)

    def _derive_baseline_deviation(self, event_type: str, metadata: Dict[str, Any]) -> float:
        explicit = metadata.get("behavior_baseline_deviation")
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        deviation_map = {
            "brute_force": 1.8,
            "lateral_movement": 1.4,
            "data_exfiltration": 1.7,
            "c2_beacon": 1.3,
            "c2_communication": 1.3,
            "privilege_escalation": 1.6,
        }
        return deviation_map.get(event_type, 0.1)

    def _derive_network_confidence(self, event_type: str, metadata: Dict[str, Any]) -> float:
        explicit = metadata.get("network_confidence_score")
        if explicit is not None:
            try:
                return float(explicit)
            except (TypeError, ValueError):
                pass

        confidence_map = {
            "brute_force": 0.7,
            "lateral_movement": 0.75,
            "data_exfiltration": 0.85,
            "c2_beacon": 0.8,
            "c2_communication": 0.8,
        }
        return confidence_map.get(event_type, 0.5)
