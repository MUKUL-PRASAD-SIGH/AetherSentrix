from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict


class AdaptiveThresholdModule:
    """
    Suppresses repetitive, low-confidence alerts based on configurable
    time windows and historical analyst feedback scores.
    """

    def __init__(
        self,
        time_window_minutes: int = 60,
        max_alerts_per_window: int = 3,
        suppression_confidence_thresholds: list[str] = ["low", "medium"],
        base_threshold: float = 0.5,
    ):
        self.time_window = timedelta(minutes=time_window_minutes)
        self.max_alerts_per_window = max_alerts_per_window
        self.suppression_confidence_thresholds = suppression_confidence_thresholds
        self.base_threshold = base_threshold
        
        # History tracks alert occurrences: key -> list of timestamps
        self.history: Dict[str, list[datetime]] = {}
        
        # Feedback scores track analyst feedback: key -> score (-1 to 1)
        # where negative means likely false positive, positive means true positive
        self.feedback_scores: Dict[str, float] = {}

    def update_feedback(self, alert_key: str, score: float) -> None:
        """Update historical feedback score for a specific alert pattern."""
        # Simple moving average for feedback scores
        current = self.feedback_scores.get(alert_key, 0.0)
        self.feedback_scores[alert_key] = (current + score) / 2.0

    def generate_alert_key(self, alert: Dict[str, Any]) -> str:
        """Generates a unique key for grouping similar alerts."""
        threat_category = alert.get("threat_category", "unknown")
        entities = alert.get("entities", {})
        
        # Determine the primary entity (user, source_ip, or process)
        primary_entity = (
            entities.get("user") or
            entities.get("source_ip") or
            entities.get("process") or
            "unknown_entity"
        )
        
        return f"{threat_category}:{primary_entity}"

    def process_alert(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates an alert and marks it as suppressed if it crosses fatigue thresholds.
        """
        confidence = alert.get("confidence", "low").lower()
        if confidence not in self.suppression_confidence_thresholds:
            return alert

        alert_key = self.generate_alert_key(alert)
        
        timestamp_str = alert.get("timestamp")
        if not timestamp_str:
            dt = datetime.utcnow()
        else:
            try:
                normalized = str(timestamp_str).replace("Z", "+00:00")
                dt = datetime.fromisoformat(normalized)
            except ValueError:
                dt = datetime.utcnow()

        # Clean history for this key
        if alert_key not in self.history:
            self.history[alert_key] = []
            
        # Keep only alerts within the time window
        self.history[alert_key] = [
            t for t in self.history[alert_key] 
            if dt - t <= self.time_window
        ]
        
        # Calculate dynamic threshold based on feedback
        feedback_score = self.feedback_scores.get(alert_key, 0.0)
        
        # If feedback is negative (historically false positive), lower the threshold to suppress earlier
        # If feedback is positive (historically true positive), raise the threshold to avoid suppression
        dynamic_max_alerts = max(1, int(self.max_alerts_per_window * (1.0 + feedback_score)))
        
        if len(self.history[alert_key]) >= dynamic_max_alerts:
            # Suppress alert
            alert["suppressed"] = True
            alert["suppression_reason"] = "Alert fatigue threshold exceeded"
            alert["severity"] = "low" # downgrade severity if not already
            
            explanation = alert.setdefault("explanation", {})
            context_notes = explanation.setdefault("context_notes", [])
            context_notes.append(
                f"Alert suppressed due to high frequency ({len(self.history[alert_key])} occurrences) "
                f"and low confidence within {self.time_window.total_seconds() / 60}m window."
            )
        else:
            alert["suppressed"] = False

        # Add to history
        self.history[alert_key].append(dt)
        
        return alert
