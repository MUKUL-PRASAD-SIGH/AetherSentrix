from .threat_classifier import ThreatClassifier
from .anomaly_detector import AnomalyDetector
from .confidence_fusion import ConfidenceFusion
from .attack_graph import AttackGraphBuilder
from .explainability import ExplainabilityEngine
from .mlops import get_model_manager

class ModelFactory:
    @staticmethod
    def create_detection_engine():
        components = get_model_manager().build_components()
        anomaly_detector = components["anomaly_detector"]
        classifier = components["classifier"]
        confidence_fusion = ConfidenceFusion()
        attack_graph_builder = AttackGraphBuilder()
        explainability_engine = ExplainabilityEngine()
        return {
            "anomaly_detector": anomaly_detector,
            "classifier": classifier,
            "confidence_fusion": confidence_fusion,
            "attack_graph_builder": attack_graph_builder,
            "explainability_engine": explainability_engine,
        }

    @staticmethod
    def create_anomaly_detector():
        return AnomalyDetector()

    @staticmethod
    def create_classifier():
        return ThreatClassifier()
