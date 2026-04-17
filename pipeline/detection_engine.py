from __future__ import annotations

from typing import Any, Dict, List, Optional

from .anomaly_detector import AnomalyDetector
from .attack_graph import AttackGraphBuilder
from .confidence_fusion import ConfidenceFusion
from .explainability import ExplainabilityEngine
from .feature_extraction.feature_extractor import FeatureExtractor
from .false_positives.false_positive_handler import FalsePositiveHandler
from .alert_fatigue.adaptive_threshold import AdaptiveThresholdModule
from .normalization.event_normalizer import EventNormalizer
from .temporal_stability import TemporalStabilityFilter
from .threat_classifier import ThreatClassifier


class DetectionEngine:
    def __init__(
        self,
        anomaly_detector: Optional[Any] = None,
        classifier: Optional[Any] = None,
        confidence_fusion: Optional[Any] = None,
        attack_graph_builder: Optional[Any] = None,
        explainability_engine: Optional[Any] = None,
        event_normalizer: Optional[Any] = None,
        feature_extractor: Optional[Any] = None,
        false_positive_handler: Optional[Any] = None,
        adaptive_threshold_module: Optional[Any] = None,
    ):
        self.anomaly_detector = anomaly_detector or AnomalyDetector()
        self.classifier = classifier or ThreatClassifier()
        self.confidence_fusion = confidence_fusion or ConfidenceFusion()
        self.attack_graph_builder = attack_graph_builder or AttackGraphBuilder()
        self.explainability_engine = explainability_engine or ExplainabilityEngine()
        self.event_normalizer = event_normalizer or EventNormalizer()
        self.feature_extractor = feature_extractor or FeatureExtractor()
        self.false_positive_handler = false_positive_handler or FalsePositiveHandler()
        self.adaptive_threshold_module = adaptive_threshold_module or AdaptiveThresholdModule()
        self.temporal_stability_filter = TemporalStabilityFilter()

    def detect(self, feature_vector: Optional[Dict[str, Any]] = None, events: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        return self.run(feature_vector or {}, events or [])

    def detect_events(self, events: List[Dict[str, Any]], feature_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.run(feature_overrides or {}, events)

    def detect_batch(self, feature_vectors: List[Dict[str, Any]], events_batch: Optional[List[List[Dict[str, Any]]]] = None) -> List[Dict[str, Any]]:
        if not feature_vectors:
            return []

        events_batch = events_batch or [[] for _ in feature_vectors]
        if len(events_batch) != len(feature_vectors):
            raise ValueError("events_batch must match feature_vectors length")

        anomaly_scores = self.anomaly_detector.score_batch(feature_vectors)
        classifications = self.classifier.predict_batch(feature_vectors)

        alerts = []
        for index, feature_vector in enumerate(feature_vectors):
            classification = classifications[index]
            anomaly_score = anomaly_scores[index]
            events = events_batch[index]
            confidence = self.confidence_fusion.calculate(feature_vector, anomaly_score, classification)
            classification, confidence = self.temporal_stability_filter.apply(
                feature_vector, classification, anomaly_score, confidence
            )
            graph = self.attack_graph_builder.build(events)
            explanation = self.explainability_engine.explain(feature_vector, anomaly_score, classification, confidence, graph)
            alert = self._build_alert(feature_vector, classification, confidence, graph, explanation)
            alert = self.false_positive_handler.adjust_alert(alert)
            alert = self.adaptive_threshold_module.process_alert(alert)
            alerts.append(alert)

        return alerts

    def detect_events_batch(
        self,
        events_batch: List[List[Dict[str, Any]]],
        feature_overrides_batch: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        if not events_batch:
            return []

        feature_overrides_batch = feature_overrides_batch or [{} for _ in events_batch]
        if len(feature_overrides_batch) != len(events_batch):
            raise ValueError("feature_overrides_batch must match events_batch length")

        prepared_feature_vectors: List[Dict[str, Any]] = []
        prepared_events_batch: List[List[Dict[str, Any]]] = []
        for index, events in enumerate(events_batch):
            prepared_feature_vector, prepared_events = self._prepare_detection_input(feature_overrides_batch[index], events)
            prepared_feature_vectors.append(prepared_feature_vector)
            prepared_events_batch.append(prepared_events)

        return self.detect_batch(prepared_feature_vectors, prepared_events_batch)

    def explain(self, *args, **kwargs) -> Dict[str, Any]:
        if len(args) == 2 and isinstance(args[0], dict) and isinstance(args[1], dict):
            detection_result, feature_vector = args
            anomaly_score = detection_result.get("anomaly_score", 0.0)
            classification = detection_result.get("classification", {})
            confidence = detection_result.get("confidence", "low")
            graph = detection_result.get("attack_graph", {})
            return self.explainability_engine.explain(feature_vector, anomaly_score, classification, confidence, graph)
        return self.explainability_engine.explain(*args, **kwargs)

    def run(self, feature_vector: Dict[str, Any], events: List[Dict[str, Any]]) -> Dict[str, Any]:
        prepared_feature_vector, prepared_events = self._prepare_detection_input(feature_vector, events)
        return self.detect_batch([prepared_feature_vector], [prepared_events])[0]

    def _prepare_detection_input(
        self,
        feature_vector: Optional[Dict[str, Any]],
        events: Optional[List[Dict[str, Any]]],
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        feature_vector = feature_vector or {}
        events = events or []

        if not events:
            return feature_vector, []

        normalized_events = [self.event_normalizer.normalize_event(event) for event in events]
        derived_feature_vector = self._build_feature_vector_from_events(normalized_events)
        prepared_feature_vector = {**derived_feature_vector, **feature_vector}
        return prepared_feature_vector, normalized_events

    def _build_feature_vector_from_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        extracted_features = [self.feature_extractor.extract_features(event) for event in events]
        latest = dict(extracted_features[-1])

        if not extracted_features:
            return latest

        latest["login_attempt_rate"] = self._aggregate_feature(extracted_features, "login_attempt_rate")
        latest["failed_login_ratio"] = self._aggregate_feature(extracted_features, "failed_login_ratio")
        latest["session_duration"] = self._aggregate_feature(extracted_features, "session_duration")
        latest["bytes_transferred"] = sum(feature.get("bytes_transferred", 0.0) for feature in extracted_features)
        latest["unique_ips"] = float(
            len(
                {
                    event.get("source_ip")
                    for event in events
                    if event.get("source_ip")
                }
            )
            or 1
        )
        latest["periodicity"] = self._aggregate_feature(extracted_features, "periodicity")
        latest["endpoint_anomaly_score"] = self._aggregate_feature(extracted_features, "endpoint_anomaly_score")
        latest["behavior_baseline_deviation"] = self._aggregate_feature(extracted_features, "behavior_baseline_deviation")
        latest["network_confidence_score"] = self._aggregate_feature(extracted_features, "network_confidence_score")
        latest["event_count"] = len(events)
        return latest

    def _aggregate_feature(self, extracted_features: List[Dict[str, Any]], key: str) -> float:
        values = [self._as_float(feature.get(key), 0.0) for feature in extracted_features]
        if not values:
            return 0.0
        values = [value for value in values if value >= 0.0]
        if not values:
            return 0.0
        return sum(values) / len(values)

    def _as_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _build_alert(
        self,
        feature_vector: Dict[str, Any],
        classification: Dict[str, Any],
        confidence: str,
        graph: Dict[str, Any],
        explanation: Dict[str, Any],
    ) -> Dict[str, Any]:
        return {
            "alert_id": feature_vector.get("event_id", "unknown"),
            "timestamp": feature_vector.get("timestamp"),
            "threat_category": classification.get("threat_category"),
            "severity": classification.get("severity"),
            "confidence": confidence,
            "risk_score": classification.get("risk_score", 0.0),
            "entities": classification.get("entities", {}),
            "attack_graph": graph,
            "explanation": explanation,
            "mitre_ids": classification.get("mitre_ids", []),
            "suggested_playbook": classification.get("suggested_playbook", []),
        }
