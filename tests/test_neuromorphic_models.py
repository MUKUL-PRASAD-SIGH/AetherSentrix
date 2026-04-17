"""Tests for the real SNN/LNN hybrid model stack."""

import numpy as np

from pipeline.anomaly_detector import AnomalyDetector
from pipeline.threat_classifier import ThreatClassifier
from pipeline.mlops.neuromorphic_models import (
    LiquidNeuralNetworkEncoder,
    SpikingNeuralNetworkEncoder,
)


def test_spiking_encoder_expands_temporal_features():
    X = np.array([[1.0, 0.2, 0.5], [0.8, 0.1, 0.4]])
    encoder = SpikingNeuralNetworkEncoder().fit(X)
    transformed = encoder.transform(X)
    assert transformed.shape == (2, 9)
    assert np.all(np.isfinite(transformed))


def test_liquid_encoder_builds_reservoir_state():
    X = np.array([[1.0, 0.2, 0.5], [0.8, 0.1, 0.4], [0.6, 0.3, 0.9]])
    encoder = LiquidNeuralNetworkEncoder(reservoir_size=8).fit(X)
    transformed = encoder.transform(X)
    assert transformed.shape == (3, 13)
    assert np.all(np.isfinite(transformed))


def test_neuromorphic_anomaly_detector_scores_structured_events():
    detector = AnomalyDetector()
    benign = {
        "login_attempt_rate": 1.0,
        "failed_login_ratio": 0.02,
        "session_duration": 3200,
        "bytes_transferred": 800000,
        "unique_ips": 3,
        "endpoint_anomaly_score": 0.08,
        "behavior_baseline_deviation": 0.05,
        "periodicity": 0.1,
        "network_confidence_score": 0.88,
    }
    suspicious = {
        "login_attempt_rate": 14.0,
        "failed_login_ratio": 0.9,
        "session_duration": 180,
        "bytes_transferred": 45000000,
        "unique_ips": 1,
        "endpoint_anomaly_score": 0.92,
        "behavior_baseline_deviation": 2.4,
        "periodicity": 0.85,
        "network_confidence_score": 0.28,
    }

    scores = detector.score_batch([benign, suspicious])
    assert len(scores) == 2
    assert scores[1] > scores[0]


def test_neuromorphic_hybrid_classifier_predicts_domain_labels():
    classifier = ThreatClassifier()
    feature_vectors = [
        {
            "login_attempt_rate": 12.0,
            "failed_login_ratio": 0.84,
            "session_duration": 240,
            "bytes_transferred": 12000,
            "unique_ips": 1,
            "endpoint_anomaly_score": 0.88,
            "behavior_baseline_deviation": 2.1,
            "periodicity": 0.2,
            "network_confidence_score": 0.3,
        },
        {
            "login_attempt_rate": 0.7,
            "failed_login_ratio": 0.0,
            "session_duration": 2200,
            "bytes_transferred": 55000,
            "unique_ips": 1,
            "endpoint_anomaly_score": 0.72,
            "behavior_baseline_deviation": 1.3,
            "periodicity": 0.92,
            "network_confidence_score": 0.42,
        },
    ]

    predictions = classifier.predict_batch(feature_vectors)
    assert len(predictions) == 2
    assert predictions[0]["threat_category"] in {"brute_force", "privilege_escalation", "malware_infection"}
    assert predictions[1]["threat_category"] in {"c2_beaconing", "data_exfiltration", "lateral_movement"}
    assert predictions[0]["model_family"] == "hybrid_snn_lnn_xgboost_rf"
