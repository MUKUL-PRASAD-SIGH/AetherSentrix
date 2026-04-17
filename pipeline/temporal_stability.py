from __future__ import annotations

from collections import Counter, deque
from typing import Any, Deque, Dict


class TemporalStabilityFilter:
    def __init__(self, max_history: int = 5, consensus_threshold: float = 0.6):
        self.max_history = max_history
        self.consensus_threshold = consensus_threshold
        self.history: Dict[str, Deque[Dict[str, Any]]] = {}

    def apply(
        self,
        feature_vector: Dict[str, Any],
        classification: Dict[str, Any],
        anomaly_score: float,
        confidence: str,
    ) -> tuple[Dict[str, Any], str]:
        signature = self._entity_signature(feature_vector)
        history = self.history.setdefault(signature, deque(maxlen=self.max_history))

        entry = {
            "category": classification.get("threat_category", "unknown"),
            "confidence": self._as_float(classification.get("confidence"), 0.0),
            "anomaly_score": float(anomaly_score),
            "severity": classification.get("severity", "medium"),
        }
        history.append(entry)

        if len(history) < 3:
            return classification, confidence

        consensus_category, consensus_ratio = self._consensus_category(history)
        avg_confidence = sum(item["confidence"] for item in history) / len(history)
        avg_anomaly = sum(item["anomaly_score"] for item in history) / len(history)

        adjusted = dict(classification)
        adjusted_explanation = adjusted.setdefault("explanation", {})

        if consensus_category != entry["category"] and consensus_ratio >= self.consensus_threshold:
            adjusted["threat_category"] = consensus_category
            adjusted["severity"] = self._cap_severity(adjusted.get("severity", "medium"), "medium")
            adjusted["confidence"] = avg_confidence
            confidence = self._normalize_confidence(avg_confidence)
            adjusted_explanation["temporal_stability"] = (
                "Smoothed recent classification to reduce flickering alerts across repeated entity activity."
            )
            return adjusted, confidence

        if avg_confidence < 0.4 and avg_anomaly < 0.4:
            adjusted["confidence"] = avg_confidence
            confidence = "low"
            adjusted_explanation["temporal_stability"] = (
                "Low confidence events across the recent window were de-emphasized to avoid false positive churn."
            )
            return adjusted, confidence

        return classification, confidence

    def _entity_signature(self, feature_vector: Dict[str, Any]) -> str:
        user = str(feature_vector.get("user", "unknown"))
        host = str(feature_vector.get("host", "unknown"))
        source_ip = str(feature_vector.get("source_ip", feature_vector.get("ip", "unknown")))
        destination_ip = str(feature_vector.get("destination_ip", feature_vector.get("dest_ip", "unknown")))
        return f"{user}|{host}|{source_ip}|{destination_ip}"

    def _consensus_category(self, history: Deque[Dict[str, Any]]) -> tuple[str, float]:
        counter = Counter(entry["category"] for entry in history)
        category, count = counter.most_common(1)[0]
        return category, count / len(history)

    def _cap_severity(self, severity: str, maximum: str) -> str:
        order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        reverse = {value: key for key, value in order.items()}
        current = order.get(severity, 1)
        ceiling = order.get(maximum, 1)
        return reverse[min(current, ceiling)]

    def _normalize_confidence(self, value: float) -> str:
        if value >= 0.8:
            return "high"
        if value >= 0.55:
            return "medium"
        return "low"

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
