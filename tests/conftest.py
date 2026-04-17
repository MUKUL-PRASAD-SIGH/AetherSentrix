"""Pytest configuration and fixtures."""

import pytest
import numpy as np
from fastapi.testclient import TestClient
from api_v2 import app
from pipeline.mlops.base_model import MockAnomalyDetector, MockThreatClassifier


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def sample_event():
    """Sample event for testing."""
    return {
        "event_id": "test_evt_001",
        "timestamp": 1713283200,
        "source_ip": "192.168.1.100",
        "dest_ip": "10.0.0.1",
        "protocol": "TCP",
        "port": 443,
        "payload_bytes": 1024,
        "duration_sec": 2.5,
        "metadata": {}
    }


@pytest.fixture
def valid_token(client):
    """Get valid JWT token."""
    response = client.post("/login", json={"username": "analyst", "password": "password"})
    return response.json()["access_token"]


@pytest.fixture
def anomaly_detector():
    """Mock anomaly detector."""
    detector = MockAnomalyDetector()
    detector.train(np.random.randn(100, 10))
    return detector


@pytest.fixture
def threat_classifier():
    """Mock threat classifier."""
    classifier = MockThreatClassifier()
    classifier.train(np.random.randn(100, 20), np.random.randint(0, 15, 100))
    return classifier


@pytest.fixture
def sample_data():
    """Generate sample test data."""
    np.random.seed(42)
    normal = np.random.randn(100, 10)
    anomalies = np.random.randn(10, 10) + 5
    return np.vstack([normal, anomalies])


# Markers
def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "performance: Performance tests")
    config.addinivalue_line("markers", "security: Security tests")
