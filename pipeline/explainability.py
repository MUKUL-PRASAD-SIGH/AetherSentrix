from typing import Dict, Any, List

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
