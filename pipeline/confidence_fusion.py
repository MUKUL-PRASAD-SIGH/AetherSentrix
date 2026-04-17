from __future__ import annotations

from typing import Any, Dict


class ConfidenceFusion:
    def calculate(self, feature_vector: Dict[str, Any], anomaly_score: float, classification: Dict[str, Any]) -> str:
        classifier_confidence = self._as_float(classification.get("confidence"), 0.0)
        network_confidence = self._as_float(feature_vector.get("network_confidence_score"), 0.0)
        baseline_deviation = min(self._as_float(feature_vector.get("behavior_baseline_deviation"), 0.0) / 2.0, 1.0)
        periodicity = self._as_float(feature_vector.get("periodicity"), 0.0)

        score = (
            anomaly_score * 0.35
            + classifier_confidence * 0.35
            + network_confidence * 0.15
            + baseline_deviation * 0.10
            + periodicity * 0.05
        )

        if classification.get("threat_category") in {"brute_force", "c2_beaconing", "data_exfiltration", "lateral_movement"}:
            score += 0.05

        score = max(0.0, min(1.0, score))

        if score >= 0.8:
            return "high"
        if score >= 0.55:
            return "medium"
        return "low"

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
