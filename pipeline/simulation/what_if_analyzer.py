from __future__ import annotations

from typing import Any, Dict, Iterable, List, Tuple


CONTROL_LIBRARY: Dict[str, Dict[str, Any]] = {
    "enable_2fa": {
        "description": "Require multi-factor authentication for privileged and remote access.",
        "coverage": {
            "event_types": {"credential_theft", "successful_login", "password_spray", "brute_force"},
            "tactics": {"Credential Access", "Initial Access"},
            "prevention": 0.55,
            "detection": 0.15,
            "delay": 45,
        },
    },
    "rate_limiting": {
        "description": "Throttle repeated requests and authentication attempts.",
        "coverage": {
            "event_types": {"brute_force", "password_spray", "network_scan", "vulnerability_scan"},
            "tactics": {"Credential Access", "Discovery"},
            "prevention": 0.45,
            "detection": 0.1,
            "delay": 30,
        },
    },
    "email_filtering": {
        "description": "Block malicious mail and attachment delivery before user interaction.",
        "coverage": {
            "event_types": {"phishing_email", "phishing_click", "malware_delivery", "credential_theft"},
            "tactics": {"Initial Access"},
            "prevention": 0.5,
            "detection": 0.2,
            "delay": 20,
        },
    },
    "conditional_access": {
        "description": "Apply device, geo, and risk-aware access policies.",
        "coverage": {
            "event_types": {"successful_login", "privilege_escalation", "lateral_movement"},
            "tactics": {"Initial Access", "Privilege Escalation", "Lateral Movement"},
            "prevention": 0.4,
            "detection": 0.25,
            "delay": 60,
        },
    },
    "network_segmentation": {
        "description": "Limit east-west movement across network zones.",
        "coverage": {
            "event_types": {"lateral_movement", "remote_service_abuse", "internal_recon"},
            "tactics": {"Lateral Movement", "Discovery"},
            "prevention": 0.6,
            "detection": 0.15,
            "delay": 90,
        },
    },
    "edr_containment": {
        "description": "Use endpoint detection and response to quarantine impacted hosts.",
        "coverage": {
            "event_types": {"malware_execution", "persistence_established", "process_injection", "ransomware_encryption"},
            "tactics": {"Execution", "Persistence", "Defense Evasion", "Impact"},
            "prevention": 0.5,
            "detection": 0.35,
            "delay": 40,
        },
    },
    "egress_filtering": {
        "description": "Restrict outbound exfiltration and command-and-control channels.",
        "coverage": {
            "event_types": {"data_exfiltration", "dns_tunneling", "c2_beacon", "c2_communication", "c2_beaconing"},
            "tactics": {"Exfiltration", "Command and Control"},
            "prevention": 0.55,
            "detection": 0.25,
            "delay": 75,
        },
    },
    "web_application_firewall": {
        "description": "Inspect and block malicious application-layer traffic.",
        "coverage": {
            "event_types": {"sql_injection", "xss", "exploit_public_facing_app"},
            "tactics": {"Initial Access", "Execution"},
            "prevention": 0.6,
            "detection": 0.2,
            "delay": 25,
        },
    },
}


ALIASES = {
    "brute_force": "brute_force_attack",
    "apt_simulation": "phishing_to_exfiltration",
    "phishing": "phishing_to_exfiltration",
    "data_theft": "phishing_to_exfiltration",
}


IMPACT_WEIGHTS = {
    "credential_theft": 0.8,
    "successful_login": 0.65,
    "brute_force": 0.55,
    "lateral_movement": 0.85,
    "malware_execution": 0.75,
    "persistence_established": 0.65,
    "c2_beacon": 0.7,
    "c2_communication": 0.7,
    "data_exfiltration": 1.0,
    "privilege_escalation": 0.9,
    "sql_injection": 0.8,
    "ransomware_encryption": 1.0,
}


BASE_DETECTION = {
    "credential_theft": 0.25,
    "successful_login": 0.18,
    "brute_force": 0.4,
    "lateral_movement": 0.32,
    "malware_execution": 0.36,
    "persistence_established": 0.3,
    "c2_beacon": 0.35,
    "c2_communication": 0.35,
    "data_exfiltration": 0.42,
    "privilege_escalation": 0.38,
    "sql_injection": 0.4,
    "ransomware_encryption": 0.55,
}


class WhatIfAnalyzer:
    def __init__(self, scenario_library):
        self.scenario_library = scenario_library

    def analyze(self, request: Dict[str, Any]) -> Dict[str, Any]:
        scenario_name, scenario = self._resolve_scenario(request)
        requested_controls = request.get("modifications") or request.get("controls") or []
        measure = str(request.get("measure", "success_probability")).strip() or "success_probability"

        normalized_controls, unsupported_controls = self._normalize_controls(requested_controls)
        baseline_projection = self._project_scenario(scenario, controls=[])
        modified_projection = self._project_scenario(scenario, controls=normalized_controls)

        baseline_metrics = self._summarize_metrics(baseline_projection)
        modified_metrics = self._summarize_metrics(modified_projection)
        comparison = self._build_comparison(measure, baseline_metrics, modified_metrics)

        return {
            "scenario": scenario_name,
            "description": scenario.get("description"),
            "measure": measure,
            "baseline_attack": request.get("baseline_attack", scenario_name),
            "controls_applied": normalized_controls,
            "unsupported_controls": unsupported_controls,
            "baseline": {
                "metrics": baseline_metrics,
                "steps": baseline_projection,
            },
            "counterfactual": {
                "metrics": modified_metrics,
                "steps": modified_projection,
            },
            "comparison": comparison,
            "control_effectiveness": self._control_effectiveness(modified_projection),
            "recommended_next_controls": self._recommend_controls(scenario, normalized_controls),
        }

    def _resolve_scenario(self, request: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        scenarios = self.scenario_library.get_scenarios()
        raw_name = str(
            request.get("scenario")
            or request.get("baseline_attack")
            or "phishing_to_exfiltration"
        ).strip()
        scenario_name = raw_name if raw_name in scenarios else ALIASES.get(raw_name, raw_name)
        scenario = scenarios.get(scenario_name)
        if scenario is None:
            raise ValueError(f"Scenario '{raw_name}' was not found")
        return scenario_name, scenario

    def _normalize_controls(self, controls: Iterable[str]) -> Tuple[List[str], List[str]]:
        normalized: List[str] = []
        unsupported: List[str] = []
        for control in controls:
            key = str(control).strip().lower().replace(" ", "_")
            if not key:
                continue
            if key in CONTROL_LIBRARY and key not in normalized:
                normalized.append(key)
            elif key not in unsupported:
                unsupported.append(key)
        return normalized, unsupported

    def _project_scenario(self, scenario: Dict[str, Any], controls: List[str]) -> List[Dict[str, Any]]:
        projected_steps: List[Dict[str, Any]] = []
        for step in scenario.get("steps", []):
            event_type = step.get("event_type", "unknown")
            repeat = int(step.get("repeat", 1))
            matched_controls = []
            prevention = 0.0
            detection_bonus = 0.0
            extra_delay = 0.0

            for control_name in controls:
                control = CONTROL_LIBRARY[control_name]
                if self._control_matches_step(control["coverage"], step, scenario):
                    matched_controls.append(control_name)
                    prevention = 1.0 - ((1.0 - prevention) * (1.0 - control["coverage"]["prevention"]))
                    detection_bonus = 1.0 - (
                        (1.0 - detection_bonus) * (1.0 - control["coverage"]["detection"])
                    )
                    extra_delay += float(control["coverage"]["delay"])

            baseline_success = 0.92
            success_probability = max(0.05, baseline_success * (1.0 - prevention))
            detection_probability = min(
                0.99,
                BASE_DETECTION.get(event_type, 0.22) + detection_bonus,
            )
            impact_weight = IMPACT_WEIGHTS.get(event_type, 0.45)
            residual_impact = round(impact_weight * success_probability * repeat, 4)

            projected_steps.append(
                {
                    "event_type": event_type,
                    "delay_seconds": float(step.get("delay", 0)),
                    "repeat": repeat,
                    "controls": matched_controls,
                    "success_probability": round(success_probability, 4),
                    "detection_probability": round(detection_probability, 4),
                    "effective_delay_seconds": round(float(step.get("delay", 0)) + extra_delay, 2),
                    "residual_impact": residual_impact,
                    "status": self._status_for_step(success_probability, matched_controls),
                }
            )

        return projected_steps

    def _control_matches_step(self, coverage: Dict[str, Any], step: Dict[str, Any], scenario: Dict[str, Any]) -> bool:
        event_type = step.get("event_type", "unknown")
        if event_type in coverage.get("event_types", set()):
            return True
        tactics = set(scenario.get("mitre_tactics", []))
        return bool(tactics.intersection(coverage.get("tactics", set())))

    def _status_for_step(self, success_probability: float, matched_controls: List[str]) -> str:
        if not matched_controls:
            return "unchanged"
        if success_probability <= 0.35:
            return "blocked"
        if success_probability <= 0.7:
            return "degraded"
        return "monitored"

    def _summarize_metrics(self, steps: List[Dict[str, Any]]) -> Dict[str, float]:
        if not steps:
            return {
                "success_probability": 0.0,
                "detection_probability": 0.0,
                "blast_radius_score": 0.0,
                "dwell_time_seconds": 0.0,
                "controls_coverage": 0.0,
            }

        success_probability = 1.0
        undetected_probability = 1.0
        blast_radius = 0.0
        dwell_time = 0.0
        covered_steps = 0

        for step in steps:
            repeat = int(step.get("repeat", 1))
            success_probability *= float(step["success_probability"]) ** repeat
            undetected_probability *= (1.0 - float(step["detection_probability"])) ** repeat
            blast_radius += float(step["residual_impact"])
            dwell_time += float(step["effective_delay_seconds"]) * repeat
            if step.get("controls"):
                covered_steps += 1

        normalized_blast_radius = min(1.0, blast_radius / max(1, len(steps)))
        return {
            "success_probability": round(success_probability, 4),
            "detection_probability": round(1.0 - undetected_probability, 4),
            "blast_radius_score": round(normalized_blast_radius, 4),
            "dwell_time_seconds": round(dwell_time, 2),
            "controls_coverage": round(covered_steps / len(steps), 4),
        }

    def _build_comparison(
        self,
        measure: str,
        baseline_metrics: Dict[str, float],
        modified_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        baseline_value = baseline_metrics.get(measure)
        modified_value = modified_metrics.get(measure)
        if baseline_value is None or modified_value is None:
            raise ValueError(f"Unsupported measure '{measure}'")

        higher_is_better = measure in {"detection_probability", "controls_coverage"}
        absolute_change = round(modified_value - baseline_value, 4)
        improvement = round((modified_value - baseline_value) if higher_is_better else (baseline_value - modified_value), 4)

        if abs(improvement) < 0.0001:
            direction = "neutral"
        elif improvement > 0:
            direction = "improved"
        else:
            direction = "degraded"

        return {
            "metric": measure,
            "baseline": baseline_value,
            "counterfactual": modified_value,
            "absolute_change": absolute_change,
            "improvement": improvement,
            "direction": direction,
        }

    def _control_effectiveness(self, steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        effectiveness: Dict[str, Dict[str, Any]] = {}
        for step in steps:
            for control_name in step.get("controls", []):
                entry = effectiveness.setdefault(
                    control_name,
                    {
                        "control": control_name,
                        "covered_steps": 0,
                        "blocked_steps": 0,
                        "degraded_steps": 0,
                    },
                )
                entry["covered_steps"] += 1
                if step["status"] == "blocked":
                    entry["blocked_steps"] += 1
                if step["status"] == "degraded":
                    entry["degraded_steps"] += 1

        return list(effectiveness.values())

    def _recommend_controls(self, scenario: Dict[str, Any], applied_controls: List[str]) -> List[str]:
        recommendations = []
        tactics = set(scenario.get("mitre_tactics", []))
        for control_name, control in CONTROL_LIBRARY.items():
            if control_name in applied_controls:
                continue
            if tactics.intersection(control["coverage"].get("tactics", set())):
                recommendations.append(control_name)
        return recommendations[:3]
