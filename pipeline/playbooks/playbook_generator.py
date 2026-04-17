from typing import Dict, Any, List

class PlaybookGenerator:
    def generate(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        threat_category = alert.get("threat_category", "unknown")
        severity = alert.get("severity", "low")
        confidence = alert.get("confidence", "low")
        entities = alert.get("entities", {})

        actions = self._get_actions(threat_category, severity, confidence, entities)
        escalation_criteria = self._get_escalation_criteria(threat_category)
        timeline = self._get_timeline(severity)

        return {
            "threat_category": threat_category,
            "actions": actions,
            "escalation_criteria": escalation_criteria,
            "timeline": timeline,
        }

    def _get_actions(self, threat_category: str, severity: str, confidence: str, entities: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions = []

        if threat_category == "brute_force":
            if severity == "high" and entities.get("user") == "admin":
                actions.append({"priority": 1, "action": "Lock account", "reason": "High severity brute force on admin account"})
                actions.append({"priority": 2, "action": "Alert SOC", "reason": "Potential credential compromise"})
            else:
                actions.append({"priority": 1, "action": "Monitor account", "reason": "Suspicious login attempts"})

        elif threat_category == "c2_beaconing":
            actions.append({"priority": 1, "action": "Block external host", "reason": "Prevent C2 communication"})
            actions.append({"priority": 2, "action": "Inspect endpoint", "reason": "Check for malware"})

        elif threat_category == "lateral_movement":
            actions.append({"priority": 1, "action": "Isolate endpoint", "reason": "Contain potential compromise"})
            actions.append({"priority": 2, "action": "Review internal connections", "reason": "Map attack path"})

        elif threat_category == "data_exfiltration":
            if entities.get("user") == "admin":
                actions.append({"priority": 1, "action": "Verify admin activity", "reason": "Check if benign"})
            else:
                actions.append({"priority": 1, "action": "Block outbound traffic", "reason": "Prevent data loss"})
                actions.append({"priority": 2, "action": "Quarantine host", "reason": "Isolate compromised system"})

        return actions

    def _get_escalation_criteria(self, threat_category: str) -> List[str]:
        criteria = {
            "brute_force": ["Repeated failures", "Admin account targeted", "Multiple IPs involved"],
            "c2_beaconing": ["Beaconing continues", "Data exfiltration detected", "Malware found"],
            "lateral_movement": ["Privilege escalation", "Data access", "External communication"],
            "data_exfiltration": ["Large data volume", "Sensitive data", "Off-hours activity"],
        }
        return criteria.get(threat_category, ["Unusual persistence", "Escalation signs"])

    def _get_timeline(self, severity: str) -> str:
        if severity == "high":
            return "Immediate"
        elif severity == "medium":
            return "Within 1 hour"
        else:
            return "Review within 24 hours"
