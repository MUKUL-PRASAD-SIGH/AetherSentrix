from __future__ import annotations

from datetime import datetime
from typing import Any, Dict


class FalsePositiveHandler:
    def adjust_alert(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        threat_category = alert.get("threat_category")
        entities = alert.get("entities", {}) or {}
        explanation = alert.setdefault("explanation", {})
        context_notes = explanation.setdefault("context_notes", [])

        if entities.get("user") == "admin" and threat_category == "data_exfiltration" and self._is_business_hours(alert):
            alert["severity"] = "low"
            context_notes.append("Likely benign admin activity during business hours.")

        if entities.get("user") in ["service_account", "backup_user"] and threat_category == "brute_force":
            alert["severity"] = "low"
            context_notes.append("Service account with expected authentication patterns.")

        if not self._is_business_hours(alert) and threat_category == "data_exfiltration":
            alert["severity"] = self._cap_severity(alert.get("severity", "medium"), "medium")
            context_notes.append("Off-hours transfer retained elevated severity for investigation.")

        return alert

    def _is_business_hours(self, alert: Dict[str, Any]) -> bool:
        timestamp = alert.get("timestamp")
        if not timestamp:
            return True

        try:
            normalized = str(timestamp).replace("Z", "+00:00")
            dt = datetime.fromisoformat(normalized)
        except ValueError:
            return True

        return dt.weekday() < 5 and 8 <= dt.hour < 18

    def _cap_severity(self, severity: str, maximum: str) -> str:
        order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        reverse = {value: key for key, value in order.items()}
        current = order.get(severity, 1)
        ceiling = order.get(maximum, 1)
        return reverse[min(current, ceiling)]
