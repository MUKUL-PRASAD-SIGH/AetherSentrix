from __future__ import annotations

from typing import Any, Dict, Optional

from pipeline.anomaly_detector import AnomalyDetector
from pipeline.threat_classifier import ThreatClassifier

from .dataset_loader import DatasetLoader
from .ensemble_classifier import XGBoostRFEnsemble
from .model_registry import ModelRegistry
from .training_pipeline import TrainingPipeline


class ModelManager:
    def __init__(self, dataset_dir: str = "data/datasets", registry_dir: str = "data/model_registry"):
        self.dataset_loader = DatasetLoader(dataset_dir)
        self.registry = ModelRegistry(registry_dir)
        self.training_pipeline = TrainingPipeline()

    def build_components(self) -> Dict[str, Any]:
        bundles = self.registry.load_active_bundles()
        if not bundles:
            return {
                "anomaly_detector": AnomalyDetector(training_profile="synthetic"),
                "classifier": ThreatClassifier(training_profile="synthetic"),
            }

        metadata = bundles["metadata"]
        classifier_bundle = bundles["classifier"]
        anomaly_bundle = bundles["anomaly"]

        if isinstance(anomaly_bundle.get("model"), AnomalyDetector):
            anomaly_detector = anomaly_bundle["model"]
            anomaly_detector.training_profile = metadata.get("source_mode", "real")
        else:
            anomaly_detector = AnomalyDetector(
                model=anomaly_bundle["model"],
                scaler=anomaly_bundle["scaler"],
                training_profile=metadata.get("source_mode", "real"),
            )

        if isinstance(classifier_bundle.get("model"), ThreatClassifier):
            classifier = classifier_bundle["model"]
            classifier.training_profile = metadata.get("source_mode", "real")
            return {
                "anomaly_detector": anomaly_detector,
                "classifier": classifier,
            }

        # Check if ensemble is configured
        if isinstance(classifier_bundle.get("model"), dict) and "xgb_model" in classifier_bundle["model"]:
            # Ensemble model
            classifier = XGBoostRFEnsemble(
                xgb_config=classifier_bundle["model"].get("xgb_config"),
                rf_config=classifier_bundle["model"].get("rf_config"),
                scaler=classifier_bundle["scaler"],
                label_encoder=classifier_bundle["label_encoder"],
                training_profile=metadata.get("source_mode", "real"),
            )
            classifier.xgb_model = classifier_bundle["model"]["xgb_model"]
            classifier.rf_model = classifier_bundle["model"]["rf_model"]
            classifier.is_trained = True
        else:
            # Standard classifier
            classifier = ThreatClassifier(
                model=classifier_bundle["model"],
                scaler=classifier_bundle["scaler"],
                label_encoder=classifier_bundle["label_encoder"],
                training_profile=metadata.get("source_mode", "real"),
            )

        return {
            "anomaly_detector": anomaly_detector,
            "classifier": classifier,
        }

    def discover_datasets(self) -> list[Dict[str, Any]]:
        return [dataset.__dict__ for dataset in self.dataset_loader.discover()]

    def get_status(self) -> Dict[str, Any]:
        registry = self.registry.load_registry()
        active_version = registry.get("active_version")
        active_run = next(
            (item for item in registry.get("versions", []) if item.get("version") == active_version),
            None,
        )
        discovered = self.discover_datasets()

        return {
            "active_mode": registry.get("active_mode", "synthetic"),
            "active_version": active_version,
            "real_mode_available": bool(registry.get("latest_real_version")),
            "active_run": active_run,
            "available_datasets": discovered,
            "recommendations": self._build_recommendations(active_run, discovered),
        }

    def train(
        self,
        *,
        source_mode: str,
        dataset_name: Optional[str] = None,
        dataset_path: Optional[str] = None,
        activate: bool = True,
    ) -> Dict[str, Any]:
        if source_mode == "synthetic":
            training_result = self.training_pipeline.train_synthetic()
        elif source_mode == "real":
            dataset_payload = self.dataset_loader.load(dataset_name=dataset_name, dataset_path=dataset_path)
            training_result = self.training_pipeline.train_real(dataset_payload)
        else:
            raise ValueError("source_mode must be 'synthetic' or 'real'")

        run = self.registry.save_training_run(
            source_mode=training_result["source_mode"],
            dataset_name=training_result["dataset_name"],
            dataset_family=training_result["dataset_family"],
            metrics=training_result["metrics"],
            classifier_bundle=training_result["classifier_bundle"],
            anomaly_bundle=training_result["anomaly_bundle"],
            activate=activate,
        )
        return {"run": run, "status": self.get_status()}

    def switch_mode(self, mode: str) -> Dict[str, Any]:
        self.registry.activate_mode(mode)
        return self.get_status()

    def _build_recommendations(self, active_run: Optional[Dict[str, Any]], discovered: list[Dict[str, Any]]) -> list[str]:
        recommendations = []
        if discovered and not active_run:
            recommendations.append("Real datasets were found locally. Train and activate a real model profile.")
        if not discovered:
            recommendations.append("Add CICIDS2017, UNSW-NB15, NSL-KDD, or a preprocessed CSV under data/datasets.")
        if active_run:
            classifier_metrics = active_run.get("metrics", {}).get("classifier", {})
            macro_f1 = classifier_metrics.get("macro_f1")
            if isinstance(macro_f1, (float, int)) and macro_f1 < 0.8:
                recommendations.append("The Threat Classifier's confidence is running below 80%. Analysts should treat categorized alerts as 'suspected' rather than 'confirmed' and actively escalate high-risk network traffic for manual investigation.")
            anomaly_metrics = active_run.get("metrics", {}).get("anomaly", {})
            recall = anomaly_metrics.get("recall")
            if isinstance(recall, (float, int)) and recall < 0.75:
                recommendations.append("The Anomaly Detector is currently under-reporting. Analysts are advised to proactively hunt for stealthy threats in the raw activity logs and strictly verify trusted internal baselines to avoid missing subtle breaches.")
        return recommendations


_MODEL_MANAGER: Optional[ModelManager] = None


def get_model_manager() -> ModelManager:
    global _MODEL_MANAGER
    if _MODEL_MANAGER is None:
        _MODEL_MANAGER = ModelManager()
    return _MODEL_MANAGER
