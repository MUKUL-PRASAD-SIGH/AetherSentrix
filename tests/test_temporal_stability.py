"""Unit tests for temporal stability smoothing."""

from pipeline.temporal_stability import TemporalStabilityFilter


def test_temporal_stability_consensus_stabilizes_category():
    smoother = TemporalStabilityFilter(max_history=5, consensus_threshold=0.6)
    feature_vector = {
        "user": "alice",
        "host": "host-1",
        "source_ip": "10.0.0.1",
        "destination_ip": "172.16.0.5",
    }

    classification = {"threat_category": "brute_force", "severity": "high", "confidence": 0.55}
    confidence = "medium"

    for category in ["brute_force", "brute_force", "c2_beaconing", "c2_beaconing", "c2_beaconing"]:
        classification = {"threat_category": category, "severity": "high", "confidence": 0.6}
        classification, confidence = smoother.apply(feature_vector, classification, anomaly_score=0.65, confidence=confidence)

    assert classification["threat_category"] == "c2_beaconing"
    assert classification["severity"] in {"low", "medium", "high"}
    assert confidence in {"low", "medium", "high"}
    assert "temporal_stability" in classification.get("explanation", {})


def test_temporal_stability_low_confidence_reduces_alert_weight():
    smoother = TemporalStabilityFilter(max_history=4, consensus_threshold=0.7)
    feature_vector = {
        "user": "bob",
        "host": "host-2",
        "source_ip": "10.0.0.2",
        "destination_ip": "172.16.0.6",
    }

    classification = {"threat_category": "data_exfiltration", "severity": "high", "confidence": 0.2}
    confidence = "low"

    for _ in range(4):
        classification, confidence = smoother.apply(feature_vector, classification, anomaly_score=0.2, confidence=confidence)

    assert confidence == "low"
    assert classification["confidence"] <= 0.4
    assert "temporal_stability" in classification.get("explanation", {})
