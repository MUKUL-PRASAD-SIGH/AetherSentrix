"""Unit tests for XGBoost + RF ensemble classifier."""

import numpy as np
import pytest
from pipeline.mlops.ensemble_classifier import XGBoostRFEnsemble


@pytest.mark.unit
class TestXGBoostRFEnsemble:
    """Test the XGBoost + Random Forest ensemble."""

    def test_initialization(self):
        """Ensemble initializes correctly."""
        ensemble = XGBoostRFEnsemble()
        assert ensemble is not None
        assert not ensemble.is_trained
        assert ensemble.xgb_model is not None
        assert ensemble.rf_model is not None

    def test_training(self, sample_data):
        """Ensemble trains successfully."""
        X = sample_data
        y = np.random.choice(['normal_traffic', 'brute_force', 'c2_beaconing'], X.shape[0])
        ensemble = XGBoostRFEnsemble()
        ensemble.fit(X, y)
        assert ensemble.is_trained

    def test_prediction(self, sample_data):
        """Ensemble makes predictions."""
        X = sample_data
        y = np.random.choice(['normal_traffic', 'brute_force', 'c2_beaconing'], X.shape[0])
        ensemble = XGBoostRFEnsemble()
        ensemble.fit(X, y)
        
        predictions = ensemble.predict(X[:5])
        assert len(predictions) == 5
        assert all(pred in ['normal_traffic', 'brute_force', 'c2_beaconing'] for pred in predictions)

    def test_batch_prediction(self, sample_data):
        """Ensemble handles batch predictions."""
        X = sample_data[:10]
        y = np.random.choice(['normal_traffic', 'brute_force'], 10)
        ensemble = XGBoostRFEnsemble()
        ensemble.fit(X, y)
        
        feature_vectors = [{'login_attempt_rate': 1.0, 'failed_login_ratio': 0.05, 'session_duration': 3600,
                           'bytes_transferred': 1000000, 'unique_ips': 5, 'endpoint_anomaly_score': 0.1,
                           'behavior_baseline_deviation': 0.0, 'periodicity': 0.0, 'network_confidence_score': 0.8}
                          for _ in range(5)]
        
        results = ensemble.predict_batch(feature_vectors)
        assert len(results) == 5
        assert all('threat_category' in r for r in results)
        assert all('confidence' in r for r in results)

    def test_fine_tuning(self, sample_data):
        """Ensemble supports fine-tuning."""
        X = sample_data
        y = np.random.choice(['normal_traffic', 'brute_force'], X.shape[0])
        ensemble = XGBoostRFEnsemble()
        ensemble.fit(X, y)
        
        # Fine-tune with subset
        X_fine = X[:50]
        y_fine = y[:50]
        ensemble.fine_tune(X_fine, y_fine, learning_rate=0.01)
        assert ensemble.is_trained

    def test_serialization(self, sample_data, tmp_path):
        """Ensemble can be saved and loaded."""
        X = sample_data
        y = np.random.choice(['normal_traffic', 'brute_force'], X.shape[0])
        ensemble = XGBoostRFEnsemble()
        ensemble.fit(X, y)
        
        model_path = tmp_path / "ensemble.pkl"
        ensemble.save_model(str(model_path))
        
        loaded = XGBoostRFEnsemble.load_model(str(model_path))
        assert loaded.is_trained
        assert loaded.xgb_model is not None
        assert loaded.rf_model is not None
