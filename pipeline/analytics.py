from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Tuple


def confidence_to_score(confidence: Any) -> float:
    if isinstance(confidence, (int, float)):
        return max(0.0, min(1.0, float(confidence)))

    mapping = {
        "low": 0.35,
        "medium": 0.65,
        "high": 0.9,
    }
    return mapping.get(str(confidence).lower(), 0.5)


def build_dashboard_metrics(alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_alerts = len(alerts)
    high_severity = sum(1 for alert in alerts if alert.get("severity") == "high")
    low_confidence = sum(1 for alert in alerts if confidence_to_score(alert.get("confidence")) < 0.5)
    avg_confidence = (
        sum(confidence_to_score(alert.get("confidence")) for alert in alerts) / total_alerts
        if total_alerts
        else 0.0
    )

    return {
        "total_alerts": total_alerts,
        "high_severity": high_severity,
        "detection_rate": round(avg_confidence, 3),
        "false_positives": low_confidence,
    }


def build_severity_distribution(alerts: List[Dict[str, Any]]) -> Dict[str, int]:
    counter = Counter(alert.get("severity", "unknown") for alert in alerts)
    return {
        "low": counter.get("low", 0),
        "medium": counter.get("medium", 0),
        "high": counter.get("high", 0),
    }


def build_heatmap_matrix(alerts: List[Dict[str, Any]]) -> Tuple[List[str], List[str], List[List[int]]]:
    categories = sorted({alert.get("threat_category", "unknown") for alert in alerts}) or ["unknown"]
    sources = sorted(
        {
            (
                alert.get("entities", {}).get("source_ip")
                or alert.get("entities", {}).get("host")
                or "unknown"
            )
            for alert in alerts
        }
    ) or ["unknown"]

    counts = defaultdict(int)
    for alert in alerts:
        category = alert.get("threat_category", "unknown")
        source = alert.get("entities", {}).get("source_ip") or alert.get("entities", {}).get("host") or "unknown"
        counts[(category, source)] += 1

    matrix = []
    for source in sources:
        row = []
        for category in categories:
            row.append(counts[(category, source)])
        matrix.append(row)

    return categories, sources, matrix


def collect_graph_elements(alerts: Iterable[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    node_map: Dict[str, Dict[str, Any]] = {}
    edge_map: Dict[Tuple[str, str, str], Dict[str, Any]] = {}

    for alert in alerts:
        graph = alert.get("attack_graph", {}) or {}
        for node in graph.get("nodes", []):
            node_id = node.get("id")
            if node_id and node_id not in node_map:
                node_map[node_id] = node

        for edge in graph.get("edges", []):
            source = edge.get("source")
            target = edge.get("target")
            label = edge.get("label", "related_to")
            if not source or not target:
                continue

            key = (source, target, label)
            if key not in edge_map:
                edge_map[key] = {
                    "source": source,
                    "target": target,
                    "label": label,
                    "weight": 0,
                }
            edge_map[key]["weight"] += 1

    return list(node_map.values()), list(edge_map.values())
