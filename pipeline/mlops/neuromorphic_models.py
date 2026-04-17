from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from pipeline.feature_schema import FEATURE_KEYS as SHARED_FEATURE_KEYS

from .ensemble_classifier import XGBoostRFEnsemble


DEFAULT_FEATURE_KEYS: tuple[str, ...] = tuple(SHARED_FEATURE_KEYS)


def _as_2d_array(X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
    array = np.asarray(X, dtype="float64")
    if array.ndim == 1:
        array = array.reshape(1, -1)
    return array


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


class SpikingNeuralNetworkEncoder:
    """Leaky integrate-and-fire temporal encoder for security feature vectors."""

    def __init__(
        self,
        *,
        timesteps: int = 6,
        decay: float = 0.78,
        threshold: float = 0.6,
    ):
        self.timesteps = timesteps
        self.decay = decay
        self.threshold = threshold
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: np.ndarray | Sequence[Sequence[float]]) -> "SpikingNeuralNetworkEncoder":
        array = _as_2d_array(X)
        self.scaler.fit(array)
        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Spiking encoder must be fit before transform")

        array = self.scaler.transform(_as_2d_array(X))
        encoded = []
        for sample in array:
            membrane = np.zeros_like(sample)
            previous_spike = np.zeros_like(sample)
            spike_count = np.zeros_like(sample)

            for tick in range(self.timesteps):
                temporal_gain = 1.0 + (tick / max(1, self.timesteps - 1)) * 0.2
                current = (sample * temporal_gain) + (0.18 * previous_spike) - (0.05 * membrane)
                membrane = (self.decay * membrane) + current
                spike = (membrane >= self.threshold).astype(float)
                membrane = np.where(spike > 0, membrane - self.threshold, membrane)
                spike_count += spike
                previous_spike = spike

            spike_rate = spike_count / float(self.timesteps)
            burst_energy = np.abs(sample) * spike_rate
            encoded.append(np.concatenate((spike_rate, membrane, burst_energy)))

        return np.asarray(encoded, dtype="float64")

    def fit_transform(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        return self.fit(X).transform(X)


class LiquidNeuralNetworkEncoder:
    """Liquid-state encoder with a small sparse recurrent reservoir."""

    def __init__(
        self,
        *,
        reservoir_size: int = 24,
        leak_rate: float = 0.35,
        spectral_radius: float = 0.9,
        sparsity: float = 0.35,
        random_state: int = 42,
    ):
        self.reservoir_size = reservoir_size
        self.leak_rate = leak_rate
        self.spectral_radius = spectral_radius
        self.sparsity = sparsity
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.input_weights: Optional[np.ndarray] = None
        self.recurrent_weights: Optional[np.ndarray] = None
        self.is_fitted = False

    def fit(self, X: np.ndarray | Sequence[Sequence[float]]) -> "LiquidNeuralNetworkEncoder":
        array = _as_2d_array(X)
        self.scaler.fit(array)

        rng = np.random.default_rng(self.random_state)
        input_dim = array.shape[1]
        self.input_weights = rng.normal(
            loc=0.0,
            scale=1.0 / max(1, np.sqrt(input_dim)),
            size=(self.reservoir_size, input_dim),
        )
        recurrent = rng.normal(
            loc=0.0,
            scale=1.0 / max(1, np.sqrt(self.reservoir_size)),
            size=(self.reservoir_size, self.reservoir_size),
        )
        connectivity_mask = (
            rng.random((self.reservoir_size, self.reservoir_size)) < (1.0 - self.sparsity)
        )
        recurrent *= connectivity_mask

        eigenvalues = np.linalg.eigvals(recurrent)
        current_radius = float(np.max(np.abs(eigenvalues))) if eigenvalues.size else 1.0
        if current_radius > 0:
            recurrent *= self.spectral_radius / current_radius

        self.recurrent_weights = recurrent
        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        if not self.is_fitted or self.input_weights is None or self.recurrent_weights is None:
            raise ValueError("Liquid encoder must be fit before transform")

        array = self.scaler.transform(_as_2d_array(X))
        encoded = []
        for sample in array:
            state = np.zeros(self.reservoir_size, dtype="float64")
            for tick in range(4):
                temporal_input = sample * (1.0 + 0.1 * tick)
                drive = self.input_weights @ temporal_input
                recurrent_drive = self.recurrent_weights @ state
                candidate = np.tanh(drive + recurrent_drive)
                state = ((1.0 - self.leak_rate) * state) + (self.leak_rate * candidate)

            summary = np.array(
                [
                    float(state.mean()),
                    float(state.std()),
                    float(np.linalg.norm(state)),
                    float(np.max(state)),
                    float(np.min(state)),
                ],
                dtype="float64",
            )
            encoded.append(np.concatenate((state, summary)))

        return np.asarray(encoded, dtype="float64")

    def fit_transform(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        return self.fit(X).transform(X)


@dataclass
class ArchitectureSummary:
    anomaly_detector: str
    classifier: str


class NeuromorphicAnomalyDetector:
    """Anomaly detector backed by SNN and liquid-state encoders."""

    def __init__(
        self,
        *,
        feature_keys: Sequence[str] = DEFAULT_FEATURE_KEYS,
        model: Optional[Any] = None,
        feature_scaler: Optional[StandardScaler] = None,
        spiking_encoder: Optional[SpikingNeuralNetworkEncoder] = None,
        liquid_encoder: Optional[LiquidNeuralNetworkEncoder] = None,
        contamination: float = 0.05,
        training_profile: str = "synthetic",
    ):
        self.feature_keys = tuple(feature_keys)
        self.training_profile = training_profile
        self.contamination = contamination
        self.spiking_encoder = spiking_encoder or SpikingNeuralNetworkEncoder()
        self.liquid_encoder = liquid_encoder or LiquidNeuralNetworkEncoder()
        self.feature_scaler = feature_scaler or StandardScaler()
        self.model = model or IsolationForest(
            n_estimators=300,
            contamination=contamination,
            random_state=42,
        )
        self.threshold = 0.65
        self.is_trained = False

    def fit(self, X: np.ndarray | Sequence[Sequence[float]], y: Optional[np.ndarray] = None) -> "NeuromorphicAnomalyDetector":
        array = _as_2d_array(X)
        if y is not None and len(y):
            contamination = float(np.clip(np.mean(y), 0.01, 0.2))
            self.contamination = contamination
            if hasattr(self.model, "set_params"):
                self.model.set_params(contamination=contamination)

        combined = self._compose_features(array, fit=True)
        scaled = self.feature_scaler.fit_transform(combined)
        self.model.fit(scaled)

        raw_scores = self.model.decision_function(scaled)
        anomaly_scores = 1.0 / (1.0 + np.exp(raw_scores))
        quantile = float(np.clip(1.0 - self.contamination, 0.5, 0.99))
        self.threshold = float(np.quantile(anomaly_scores, quantile))
        self.is_trained = True
        return self

    def detect(self, X: np.ndarray | Sequence[Sequence[float]]) -> Dict[str, np.ndarray]:
        if not self.is_trained:
            raise ValueError("Neuromorphic anomaly detector is not trained")

        array = _as_2d_array(X)
        combined = self._compose_features(array, fit=False)
        scaled = self.feature_scaler.transform(combined)
        raw_scores = self.model.decision_function(scaled)
        anomaly_scores = 1.0 / (1.0 + np.exp(raw_scores))
        confidence = np.abs(anomaly_scores - self.threshold) / max(self.threshold, 1.0 - self.threshold, 1e-6)
        confidence = np.clip(confidence, 0.0, 1.0)
        is_anomaly = anomaly_scores >= self.threshold

        return {
            "is_anomaly": is_anomaly.astype(bool),
            "anomaly_score": anomaly_scores.astype(float),
            "confidence": confidence.astype(float),
            "raw_decision": raw_scores.astype(float),
        }

    def score_batch_from_dicts(self, feature_vectors: Iterable[Dict[str, Any]]) -> List[float]:
        vectors = list(feature_vectors)
        if not vectors:
            return []
        X = np.asarray([self.features_from_dict(vector) for vector in vectors], dtype="float64")
        return [float(score) for score in self.detect(X)["anomaly_score"]]

    def features_from_dict(self, feature_vector: Dict[str, Any]) -> List[float]:
        return [_as_float(feature_vector.get(key), 0.0) for key in self.feature_keys]

    def _compose_features(self, X: np.ndarray, *, fit: bool) -> np.ndarray:
        spike_features = self.spiking_encoder.fit_transform(X) if fit else self.spiking_encoder.transform(X)
        liquid_features = self.liquid_encoder.fit_transform(X) if fit else self.liquid_encoder.transform(X)
        return np.concatenate((X, spike_features, liquid_features), axis=1)


class NeuromorphicHybridClassifier:
    """Hybrid SNN + LNN feature pipeline feeding the ensemble classifier."""

    def __init__(
        self,
        *,
        feature_keys: Sequence[str] = DEFAULT_FEATURE_KEYS,
        ensemble: Optional[XGBoostRFEnsemble] = None,
        spiking_encoder: Optional[SpikingNeuralNetworkEncoder] = None,
        liquid_encoder: Optional[LiquidNeuralNetworkEncoder] = None,
        training_profile: str = "synthetic",
    ):
        self.feature_keys = tuple(feature_keys)
        self.ensemble = ensemble or XGBoostRFEnsemble()
        self.spiking_encoder = spiking_encoder or SpikingNeuralNetworkEncoder()
        self.liquid_encoder = liquid_encoder or LiquidNeuralNetworkEncoder()
        self.training_profile = training_profile
        self.is_trained = False

    def fit(self, X: np.ndarray | Sequence[Sequence[float]], y: np.ndarray | Sequence[str]) -> "NeuromorphicHybridClassifier":
        array = _as_2d_array(X)
        labels = np.asarray(y)
        combined = self._compose_features(array, fit=True)
        self.ensemble.fit(combined, labels)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Neuromorphic classifier is not trained")
        array = _as_2d_array(X)
        combined = self._compose_features(array, fit=False)
        return self.ensemble.predict(combined)

    def predict_proba(self, X: np.ndarray | Sequence[Sequence[float]]) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Neuromorphic classifier is not trained")
        array = _as_2d_array(X)
        combined = self._compose_features(array, fit=False)
        return self.ensemble.predict_proba(combined)

    def predict_batch(self, feature_vectors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not feature_vectors:
            return []

        X = np.asarray([self.features_from_dict(vector) for vector in feature_vectors], dtype="float64")
        predictions = self.predict(X)
        probabilities = self.predict_proba(X)

        results = []
        for index, label in enumerate(predictions):
            threat_category = str(label)
            max_prob = float(np.max(probabilities[index]))
            results.append(
                {
                    "threat_category": threat_category,
                    "severity": self.ensemble._get_severity(threat_category),
                    "risk_score": self.ensemble._get_risk_score(threat_category),
                    "entities": self.ensemble._extract_entities(feature_vectors[index]),
                    "mitre_ids": self.ensemble._get_mitre_ids(threat_category),
                    "suggested_playbook": self.ensemble._get_playbook(threat_category),
                    "confidence": max_prob,
                    "model_family": "hybrid_snn_lnn_xgboost_rf",
                }
            )
        return results

    def features_from_dict(self, feature_vector: Dict[str, Any]) -> List[float]:
        return [_as_float(feature_vector.get(key), 0.0) for key in self.feature_keys]

    def _compose_features(self, X: np.ndarray, *, fit: bool) -> np.ndarray:
        spike_features = self.spiking_encoder.fit_transform(X) if fit else self.spiking_encoder.transform(X)
        liquid_features = self.liquid_encoder.fit_transform(X) if fit else self.liquid_encoder.transform(X)
        return np.concatenate((X, spike_features, liquid_features), axis=1)


def default_architecture_summary() -> ArchitectureSummary:
    return ArchitectureSummary(
        anomaly_detector="snn_lnn_isolation_forest",
        classifier="hybrid_snn_lnn_xgboost_rf",
    )
