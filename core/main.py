from __future__ import annotations

import sys
from functools import lru_cache

from demo.demo_runner import DashboardSimulator, DemoRunner, ScenarioPlayer
from pipeline.mlops import get_model_manager
from pipeline.anomaly_detector import AnomalyDetector
from pipeline.attack_graph import AttackGraphBuilder
from pipeline.confidence_fusion import ConfidenceFusion
from pipeline.detection_engine import DetectionEngine
from pipeline.explainability import ExplainabilityEngine
from pipeline.config import load_dotenv
from pipeline.simulation.attack_simulator import AttackSimulator, EventGenerator, ScenarioLibrary
from pipeline.threat_classifier import ThreatClassifier

load_dotenv()
model_manager = get_model_manager()


@lru_cache(maxsize=1)
def build_detection_engine() -> DetectionEngine:
    components = model_manager.build_components()
    anomaly_detector = components["anomaly_detector"]
    classifier = components["classifier"]
    confidence_fusion = ConfidenceFusion()
    attack_graph_builder = AttackGraphBuilder()
    explainability_engine = ExplainabilityEngine()
    return DetectionEngine(anomaly_detector, classifier, confidence_fusion, attack_graph_builder, explainability_engine)


def refresh_detection_engine() -> DetectionEngine:
    build_detection_engine.cache_clear()
    return build_detection_engine()


def run_demo():
    simulator = AttackSimulator(ScenarioLibrary(), EventGenerator())
    scenario_player = ScenarioPlayer(simulator)
    dashboard_simulator = DashboardSimulator()
    detection_engine = build_detection_engine()

    runner = DemoRunner(scenario_player, dashboard_simulator, detection_engine)
    summary = runner.run_demo()

    print("\nDemo complete. Dashboard data summary:")
    print(summary)


def print_usage():
    print("Usage: python main.py demo")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print_usage()
        sys.exit(1)

    mode = sys.argv[1].lower()
    if mode == "demo":
        run_demo()
    else:
        print_usage()
        sys.exit(1)
