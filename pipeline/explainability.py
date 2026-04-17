from typing import Dict, Any, List, Optional


class ExplainabilityEngine:
    def explain(self, *args, **kwargs) -> Dict[str, Any]:
        # Support both full explain signature and simple pipeline inputs
        if len(args) == 2 and isinstance(args[0], dict) and isinstance(args[1], dict):
            detection_result, feature_vector = args
            anomaly_score = detection_result.get("anomaly_score", 0.0)
            classification = detection_result.get("classification", {})
            confidence = detection_result.get("confidence", "low")
            graph = detection_result.get("attack_graph", {})
        elif len(args) == 5:
            feature_vector, anomaly_score, classification, confidence, graph = args
        else:
            feature_vector = kwargs.get("feature_vector", {})
            anomaly_score = kwargs.get("anomaly_score", 0.0)
            classification = kwargs.get("classification", {})
            confidence = kwargs.get("confidence", "low")
            graph = kwargs.get("graph", {})

        evidence = []
        cause_chain = []

        if anomaly_score > 0.7:
            evidence.append({"reason": "High anomaly score", "value": anomaly_score})
            cause_chain.append("Anomaly detection flagged unusual behavior.")

        if isinstance(classification, dict) and classification.get("threat_category"):
            evidence.append({"reason": "Threat classification", "value": classification["threat_category"]})
            cause_chain.append(f"Matched threat pattern: {classification['threat_category']}")
        elif isinstance(classification, str) and classification != "unknown":
            evidence.append({"reason": "Threat classification", "value": classification})
            cause_chain.append(f"Matched threat pattern: {classification}")

        if confidence == "high":
            cause_chain.append("Cross-layer correlation increased confidence.")

        explanation_text = "This alert was triggered because " + ", ".join(cause_chain)

        return {
            "text": explanation_text,
            "evidence": evidence,
            "cause_chain": cause_chain,
            "graph_summary": {
                "node_count": len(graph.get("nodes", [])) if isinstance(graph, dict) else 0,
                "edge_count": len(graph.get("edges", [])) if isinstance(graph, dict) else 0,
            },
        }

    # ------------------------------------------------------------------
    # Sandbox / Deception Engine Explainability
    # ------------------------------------------------------------------

    def explain_sandbox_decision(
        self,
        trust_result: Dict[str, Any],
        sandbox_session: Optional[Dict[str, Any]] = None,
        intent_classification: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates a human-readable explanation for a sandbox routing decision.

        Parameters
        ----------
        trust_result : dict
            Output of TrustEngine.evaluate().to_dict()
        sandbox_session : dict, optional
            Output of SandboxSession.to_dict() — behaviour observed inside sandbox
        intent_classification : dict, optional
            Output of IntentClassifier.classify().to_dict()

        Returns a plain-English narrative suitable for the SOC analyst panel.
        """
        score = trust_result.get("trust_score", 0.5)
        flags = trust_result.get("risk_flags", [])
        label = trust_result.get("label", "SUSPICIOUS")

        # ----- Part 1: Why was this session routed to the sandbox? -----
        sandbox_reasons = []
        for flag in flags:
            if "unknown_user" in flag:
                sandbox_reasons.append("Unrecognised user account")
            elif "untrusted_ip" in flag:
                sandbox_reasons.append("Source IP not in any trusted range")
            elif "first_time_ip" in flag:
                sandbox_reasons.append("IP address seen for the first time")
            elif "high_transfer_volume" in flag:
                sandbox_reasons.append(f"Abnormal data transfer volume ({flag})")
            elif "high_request_rate" in flag:
                sandbox_reasons.append(f"Unusually high request frequency ({flag})")
            elif "novel_endpoint" in flag:
                sandbox_reasons.append("Accessing endpoints never visited before")
            elif "spike" in flag or "burst" in flag:
                sandbox_reasons.append(f"Sudden activity burst detected ({flag})")
            elif "injection" in flag:
                sandbox_reasons.append("Payload injection signatures found")
            elif "privilege_escalation" in flag:
                sandbox_reasons.append("Privilege escalation attempt detected")
            elif "failure_success_chain" in flag:
                sandbox_reasons.append("Authentication failures followed by successful login")
            elif "off_hours" in flag:
                sandbox_reasons.append(f"Activity at unusual time ({flag})")
            elif "no_baseline" in flag:
                sandbox_reasons.append("No historical baseline available for this user")
            else:
                sandbox_reasons.append(flag.replace("_", " ").capitalize())

        # ----- Part 2: What was observed inside the sandbox? -----
        observed_behaviours = []
        if sandbox_session:
            breadth = sandbox_session.get("unique_paths_count", 0)
            injections = sandbox_session.get("injection_attempts", 0)
            escalations = sandbox_session.get("privilege_escalation_attempts", 0)
            auth_fails = sandbox_session.get("auth_failures", 0)

            if breadth >= 8:
                observed_behaviours.append(
                    f"Accessed {breadth} distinct endpoints — consistent with a recon sweep"
                )
            if injections > 0:
                observed_behaviours.append(
                    f"Attempted {injections} payload injection(s) in request body/query"
                )
            if escalations > 0:
                observed_behaviours.append(
                    f"Attempted privilege escalation to admin endpoints {escalations} time(s)"
                )
            if auth_fails >= 5:
                observed_behaviours.append(
                    f"{auth_fails} authentication failures — possible credential stuffing"
                )
            if not observed_behaviours:
                observed_behaviours.append(
                    "No additional malicious signals observed — session may be a false positive"
                )

        # ----- Part 3: Conclusion -----
        intent_label = "UNKNOWN"
        intent_confidence = 0.0
        if intent_classification:
            intent_label = intent_classification.get("label", "UNKNOWN")
            intent_confidence = intent_classification.get("confidence", 0.0)

        if label == "MALICIOUS" or intent_label == "HACKER":
            conclusion = (
                f"HIGH likelihood of malicious intent. "
                f"Trust score: {score:.2f}. "
                f"Intent classification: {intent_label} "
                f"(confidence {intent_confidence:.0%}). "
                "Recommend BLOCK + SOC escalation."
            )
        elif label == "LEGIT" or intent_label == "LEGIT_ANOMALY":
            conclusion = (
                f"Session most likely a false positive. "
                f"Trust score recovered to {score:.2f}. "
                f"Intent classification: {intent_label}. "
                "Recommend allowing real access."
            )
        else:
            conclusion = (
                f"Insufficient evidence for a definitive verdict. "
                f"Trust score: {score:.2f}. Recommend continued monitoring or human review."
            )

        return {
            "sandbox_routing_reasons": sandbox_reasons,
            "observed_sandbox_behaviour": observed_behaviours,
            "trust_score": round(score, 4),
            "trust_label": label,
            "intent_label": intent_label,
            "intent_confidence": round(intent_confidence, 3),
            "conclusion": conclusion,
            "full_narrative": (
                "User moved to sandbox because:\n"
                + "\n".join(f"  - {r}" for r in sandbox_reasons)
                + ("\n\nObserved sandbox behaviour:\n"
                   + "\n".join(f"  - {b}" for b in observed_behaviours)
                   if observed_behaviours else "")
                + f"\n\nConclusion:\n  {conclusion}"
            ),
        }
