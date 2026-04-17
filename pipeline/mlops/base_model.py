"""Base classes for ML models."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pickle
import logging
import time

logger = logging.getLogger(__name__)


class BaseSecurityModel(ABC):
    """Abstract base class for security detection models."""

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.is_trained = False
        self.training_metadata = {}

    @abstractmethod
    def train(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Train the model."""
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """Make predictions."""
        pass

    @abstractmethod
    def evaluate(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> Dict[str, float]:
        """Evaluate model performance."""
        pass

    @abstractmethod
    def save_model(self, path: str):
        """Save model to disk."""
        pass

    @classmethod
    @abstractmethod
    def load_model(cls, path: str):
        """Load model from disk."""
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Get model metadata."""
        return {
            'model_name': self.model_name,
            'is_trained': self.is_trained,
            'training_metadata': self.training_metadata
        }


class AnomalyDetectorBase(BaseSecurityModel):
    """Base class for anomaly detection models."""

    def __init__(self, model_name: str = "anomaly_detector"):
        super().__init__(model_name)
        self.scaler = None

    @abstractmethod
    def detect(self, X: np.ndarray) -> Dict[str, Any]:
        """Detect anomalies in data."""
        pass

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """Alias for detect."""
        return self.detect(X)


class ThreatClassifierBase(BaseSecurityModel):
    """Base class for threat classification models."""

    def __init__(self, model_name: str = "threat_classifier"):
        super().__init__(model_name)
        self.classes = None
        self.scaler = None

    @abstractmethod
    def classify(self, X: np.ndarray) -> Dict[str, Any]:
        """Classify threats in data."""
        pass

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """Alias for classify."""
        return self.classify(X)

    def get_classes(self):
        """Get threat classes."""
        return self.classes


# Mock models for testing without trained models
class MockAnomalyDetector(AnomalyDetectorBase):
    """Mock anomaly detector for testing."""

    def train(self, X: np.ndarray, y=None) -> Dict[str, Any]:
        """Mock training."""
        self.is_trained = True
        self.training_metadata = {'samples': X.shape[0], 'features': X.shape[1]}
        logger.info(f"Mock anomaly detector trained on {X.shape[0]} samples")
        return {'status': 'mock_trained'}

    def detect(self, X: np.ndarray) -> Dict[str, Any]:
        """Mock detection - random anomaly scores."""
        n_samples = X.shape[0]
        if n_samples >= 32:
            time.sleep(0.02)

        # Simulate 10% anomalies
        scores = np.random.uniform(0.2, 0.9, n_samples)
        is_anomaly = scores > 0.7
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': scores,
            'confidence': np.abs(scores - 0.5) * 2,  # Higher scores = more confident
            'raw_decision': scores
        }

    def evaluate(self, X: np.ndarray, y=None) -> Dict[str, float]:
        """Mock evaluation."""
        return {'accuracy': 0.95, 'precision': 0.92, 'recall': 0.94}

    def save_model(self, path: str):
        """Save mock model."""
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load_model(cls, path: str):
        """Load mock model."""
        with open(path, 'rb') as f:
            return pickle.load(f)


class MockThreatClassifier(ThreatClassifierBase):
    """Mock threat classifier for testing."""

    THREAT_CATEGORIES = [
        'benign', 'bot_activity', 'brute_force', 'ddos_attack', 'exploits',
        'ftp_patator', 'heartbleed', 'infiltration', 'port_scan', 'sql_injection',
        'ssh_patator', 'web_attack_bruteforce', 'web_attack_sql_injection',
        'web_attack_xss', 'zero_day'
    ]

    def __init__(self):
        super().__init__()
        self.classes = self.THREAT_CATEGORIES

    def train(self, X: np.ndarray, y=None) -> Dict[str, Any]:
        """Mock training."""
        self.is_trained = True
        self.training_metadata = {'samples': X.shape[0], 'features': X.shape[1], 'classes': len(self.classes)}
        logger.info(f"Mock threat classifier trained on {X.shape[0]} samples")
        return {'status': 'mock_trained'}

    def classify(self, X: np.ndarray) -> Dict[str, Any]:
        """Mock classification - random threat classes."""
        n_samples = X.shape[0]
        
        # Random threat predictions
        predictions = np.random.randint(0, len(self.THREAT_CATEGORIES), n_samples)
        confidence = np.random.uniform(0.6, 1.0, n_samples)
        
        probability_vector = np.random.random(len(self.THREAT_CATEGORIES))
        probability_vector = probability_vector / probability_vector.sum()

        return {
            'threat_class': [self.THREAT_CATEGORIES[p] for p in predictions],
            'threat_id': predictions,
            'confidence': confidence,
            'all_probabilities': {
                cat: float(probability_vector[idx])
                for idx, cat in enumerate(self.THREAT_CATEGORIES)
            }
        }

    def evaluate(self, X: np.ndarray, y=None) -> Dict[str, float]:
        """Mock evaluation."""
        return {'accuracy': 0.92, 'precision': 0.89, 'recall': 0.91}

    def save_model(self, path: str):
        """Save mock model."""
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load_model(cls, path: str):
        """Load mock model."""
        with open(path, 'rb') as f:
            return pickle.load(f)
