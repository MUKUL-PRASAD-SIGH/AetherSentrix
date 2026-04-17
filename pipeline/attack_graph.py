from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Tuple


class AttackGraphBuilder:
    def build(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        node_map: Dict[str, Dict[str, Any]] = {}
        edge_map: Dict[Tuple[str, str, str], Dict[str, Any]] = {}

        for event in events:
            event_nodes = self._build_nodes_for_event(event)
            for node in event_nodes:
                node_map[node["id"]] = node

            for edge in self._build_edges_for_event(event, event_nodes):
                key = (edge["source"], edge["target"], edge["label"])
                if key not in edge_map:
                    edge_map[key] = edge
                else:
                    edge_map[key]["weight"] += edge.get("weight", 1.0)

        edges = sorted(edge_map.values(), key=lambda edge: edge.get("weight", 0.0), reverse=True)
        top_path = edges[:5]

        return {
            "nodes": list(node_map.values()),
            "edges": edges,
            "top_path": top_path,
            "summary": {
                "node_count": len(node_map),
                "edge_count": len(edges),
                "highest_risk_edge": top_path[0] if top_path else None,
            },
        }

    def _build_nodes_for_event(self, event: Dict[str, Any]) -> List[Dict[str, Any]]:
        metadata = event.get("metadata", {}) or {}
        nodes = []

        self._append_node(nodes, "user", event.get("user"))
        self._append_node(nodes, "host", event.get("host"))
        self._append_node(nodes, "ip", event.get("source_ip"))
        self._append_node(nodes, "ip", event.get("destination_ip"))
        self._append_node(nodes, "event", event.get("event_type"))
        self._append_node(nodes, "process", metadata.get("process") or metadata.get("command") or metadata.get("script"))
        self._append_node(nodes, "resource", metadata.get("url") or metadata.get("website") or metadata.get("service"))

        return nodes

    def _build_edges_for_event(self, event: Dict[str, Any], nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        by_type = defaultdict(list)
        for node in nodes:
            by_type[node["type"]].append(node["id"])

        event_type = event.get("event_type", "unknown")
        weight = self._score_event(event)
        edges = []

        user_id = self._first(by_type["user"])
        host_id = self._first(by_type["host"])
        source_ip_id = self._first(by_type["ip"])
        event_id = self._first(by_type["event"])
        process_id = self._first(by_type["process"])
        resource_id = self._first(by_type["resource"])

        if user_id and host_id:
            edges.append(self._edge(user_id, host_id, "acts_on", event, weight))
        if host_id and source_ip_id:
            edges.append(self._edge(source_ip_id, host_id, "originates_from", event, weight))
        if host_id and event_id:
            edges.append(self._edge(host_id, event_id, event_type, event, weight))
        if process_id and event_id:
            edges.append(self._edge(process_id, event_id, "executes", event, weight))
        if resource_id and event_id:
            edges.append(self._edge(event_id, resource_id, "targets", event, weight))

        destination_ip = event.get("destination_ip")
        if host_id and destination_ip:
            edges.append(self._edge(host_id, f"ip:{destination_ip}", "connects_to", event, weight))

        return edges

    def _score_event(self, event: Dict[str, Any]) -> float:
        event_type = event.get("event_type", "unknown")
        weights = {
            "brute_force": 0.9,
            "privilege_escalation": 0.95,
            "lateral_movement": 0.85,
            "data_exfiltration": 0.95,
            "c2_beacon": 0.8,
            "c2_communication": 0.8,
            "malware_execution": 0.9,
        }
        return weights.get(event_type, 0.5)

    def _append_node(self, nodes: List[Dict[str, Any]], node_type: str, value: Any) -> None:
        if value in (None, "", "unknown", "0.0.0.0"):
            return
        nodes.append({"id": f"{node_type}:{value}", "type": node_type, "label": str(value)})

    def _edge(self, source: str, target: str, label: str, event: Dict[str, Any], weight: float) -> Dict[str, Any]:
        return {
            "source": source,
            "target": target,
            "label": label,
            "weight": weight,
            "data": {
                "event_id": event.get("event_id"),
                "timestamp": event.get("timestamp"),
                "event_type": event.get("event_type"),
            },
        }

    def _first(self, values: List[str]) -> str | None:
        return values[0] if values else None
