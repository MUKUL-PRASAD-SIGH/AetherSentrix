"""Unit tests for ML components."""

import pytest
import numpy as np
from pipeline.mlops.base_model import MockAnomalyDetector, MockThreatClassifier


@pytest.mark.unit
class TestAnomalyDetector:
    """Test anomaly detector."""

    def test_initialization(self):
        """Detector initializes correctly."""
        detector = MockAnomalyDetector()
        assert detector is not None
        assert not detector.is_trained

    def test_training(self, sample_data):
        """Detector trains successfully."""
        detector = MockAnomalyDetector()
        result = detector.train(sample_data)
        assert detector.is_trained
        assert "status" in result

    def test_detection_returns_correct_shape(self, anomaly_detector, sample_data):
        """Detection returns correct output shape."""
        result = anomaly_detector.detect(sample_data)
        assert result["is_anomaly"].shape[0] == sample_data.shape[0]
        assert len(result["anomaly_score"]) == sample_data.shape[0]
        assert len(result["confidence"]) == sample_data.shape[0]

    def test_confidence_bounds(self, anomaly_detector, sample_data):
        """Confidence scores are in valid range."""
        result = anomaly_detector.detect(sample_data)
        assert np.all(result["confidence"] >= 0)
        assert np.all(result["confidence"] <= 1)
        assert np.all(result["anomaly_score"] >= 0)
        assert np.all(result["anomaly_score"] <= 1)

    def test_anomaly_detection_rate(self, anomaly_detector, sample_data):
        """Anomaly detection identifies some anomalies."""
        result = anomaly_detector.detect(sample_data)
        anomaly_count = np.sum(result["is_anomaly"])
        assert anomaly_count > 0  # Should detect some anomalies


@pytest.mark.unit
class TestThreatClassifier:
    """Test threat classifier."""

    def test_initialization(self):
        """Classifier initializes correctly."""
        classifier = MockThreatClassifier()
        assert classifier is not None
        assert len(classifier.THREAT_CATEGORIES) == 15

    def test_training(self, sample_data):
        """Classifier trains successfully."""
        X = sample_data
        y = np.random.randint(0, 15, X.shape[0])
        classifier = MockThreatClassifier()
        result = classifier.train(X, y)
        assert classifier.is_trained

    def test_classification_returns_valid_threats(self, threat_classifier, sample_data):
        """Classification returns valid threat categories."""
        result = threat_classifier.classify(sample_data)
        
        assert len(result["threat_class"]) == sample_data.shape[0]
        for threat in result["threat_class"]:
            assert threat in threat_classifier.THREAT_CATEGORIES

    def test_confidence_scores_valid(self, threat_classifier, sample_data):
        """Confidence scores are in valid range."""
        result = threat_classifier.classify(sample_data)
        assert np.all(result["confidence"] >= 0)
        assert np.all(result["confidence"] <= 1)

    def test_probability_distribution(self, threat_classifier, sample_data):
        """Probability distribution sums to 1."""
        result = threat_classifier.classify(sample_data[:1])
        probs = result["all_probabilities"]
        total = sum(probs.values())
        assert 0.99 < total < 1.01  # Allow for floating point errors


@pytest.mark.unit
class TestModelSerialization:
    """Test model save/load functionality."""

    def test_anomaly_detector_serialization(self, anomaly_detector, tmp_path):
        """Anomaly detector can be saved and loaded."""
        model_path = tmp_path / "detector.pkl"
        anomaly_detector.save_model(str(model_path))
        
        loaded = MockAnomalyDetector.load_model(str(model_path))
        assert loaded is not None
        assert loaded.is_trained

    def test_threat_classifier_serialization(self, threat_classifier, tmp_path):
        """Threat classifier can be saved and loaded."""
        model_path = tmp_path / "classifier.pkl"
        threat_classifier.save_model(str(model_path))
        
        loaded = MockThreatClassifier.load_model(str(model_path))
        assert loaded is not None
        assert loaded.is_trained


@pytest.mark.performance
class TestModelPerformance:
    """Test model performance metrics."""

    def test_anomaly_detection_latency(self, anomaly_detector, sample_data):
        """Anomaly detection latency is acceptable."""
        import time
        start = time.time()
        for _ in range(100):
            anomaly_detector.detect(sample_data[:1])
        elapsed = (time.time() - start) / 100 * 1000  # Convert to ms
        
        assert elapsed < 10  # Should be under 10ms per prediction

    def test_threat_classification_latency(self, threat_classifier, sample_data):
        """Threat classification latency is acceptable."""
        import time
        start = time.time()
        for _ in range(100):
            threat_classifier.classify(sample_data[:1])
        elapsed = (time.time() - start) / 100 * 1000  # Convert to ms
        
        assert elapsed < 10  # Should be under 10ms per prediction

    def test_batch_throughput(self, anomaly_detector, sample_data):
        """Batch processing throughput is acceptable."""
        import time
        start = time.time()
        anomaly_detector.detect(sample_data)
        elapsed = time.time() - start
        
        throughput = sample_data.shape[0] / elapsed
        assert throughput > 100  # Should process >100 samples/sec
