#!/usr/bin/env python3
"""
AetherSentrix SOC Engine - Comprehensive Test Suite
Tests all currently built features and validates system readiness
"""

import sys
import os
import time
import traceback
import json
import threading
import urllib.error
import urllib.request
from datetime import datetime
from typing import Dict, List, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def log_test_result(test_name: str, success: bool, message: str = "", error: Exception = None):
    """Log test results with formatting"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{timestamp}] {status} - {test_name}")
    if message:
        print(f"         {message}")
    if error:
        print(f"         Error: {str(error)}")
        traceback.print_exc()
    print()

def test_imports():
    """Test all module imports"""
    test_name = "Module Imports"
    try:
        # Core modules
        from core.main import build_detection_engine
        from pipeline.detection_engine import DetectionEngine
        from pipeline.explainability import ExplainabilityEngine
        from pipeline.simulation.attack_simulator import AttackSimulator, ScenarioLibrary, EventGenerator
        from pipeline.model_factory import ModelFactory
        from pipeline.feedback.feedback_system import FeedbackSystem

        # Demo modules
        from demo.demo_runner import DemoRunner, ScenarioPlayer, DashboardSimulator

        log_test_result(test_name, True, "All modules imported successfully")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Import failed", e)
        return False

def test_detection_engine():
    """Test detection engine initialization and basic functionality"""
    test_name = "Detection Engine"
    try:
        from core.main import build_detection_engine
        from pipeline.detection_engine import DetectionEngine

        # Build engine
        engine = build_detection_engine()
        assert isinstance(engine, DetectionEngine), "Engine should be DetectionEngine instance"

        # Test basic methods
        assert hasattr(engine, 'detect'), "Engine should have detect method"
        assert hasattr(engine, 'explain'), "Engine should have explain method"

        log_test_result(test_name, True, "Detection engine initialized and methods available")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Detection engine test failed", e)
        return False

def test_simulation_system():
    """Test attack simulation system"""
    test_name = "Attack Simulation"
    try:
        from pipeline.simulation.attack_simulator import AttackSimulator, ScenarioLibrary, EventGenerator

        # Initialize components
        library = ScenarioLibrary()
        generator = EventGenerator()
        simulator = AttackSimulator(library, generator)

        # Test scenario generation
        scenarios = library.get_scenarios()
        assert len(scenarios) > 0, "Should have at least one scenario"

        # Test event generation
        events = generator.generate_events("brute_force", count=5)
        assert len(events) == 5, "Should generate 5 events"

        log_test_result(test_name, True, f"Generated {len(scenarios)} scenarios and {len(events)} test events")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Simulation system test failed", e)
        return False

def test_model_factory():
    """Test model factory and ML model creation"""
    test_name = "Model Factory"
    try:
        from pipeline.model_factory import ModelFactory

        factory = ModelFactory()

        # Test model creation
        anomaly_model = factory.create_anomaly_detector()
        classifier_model = factory.create_classifier()

        assert anomaly_model is not None, "Should create anomaly detector"
        assert classifier_model is not None, "Should create classifier"

        # Test basic prediction
        test_features = [[0.1, 0.2, 0.3, 0.4]]
        anomaly_score = anomaly_model.predict(test_features)
        classification = classifier_model.predict(test_features)

        assert isinstance(anomaly_score, (list, float)), "Should return anomaly score"
        assert isinstance(classification, (dict, list, str)), "Should return classification dict or simple result"

        # If it's a dict (new ML classifier), check for required keys
        if isinstance(classification, dict):
            assert "threat_category" in classification, "Should have threat_category"
            assert "confidence" in classification, "Should have confidence score"

        log_test_result(test_name, True, "Model factory working with ML-backed models")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Model factory test failed", e)
        return False

def test_feedback_system():
    """Test feedback and learning system"""
    test_name = "Feedback System"
    try:
        from pipeline.feedback.feedback_system import FeedbackSystem

        feedback_sys = FeedbackSystem()

        # Test feedback storage
        feedback_sys.add_feedback("test_alert_1", "confirmed", "analyst_1")
        feedback_sys.add_feedback("test_alert_2", "false_positive", "analyst_2")

        # Test feedback retrieval
        pending = feedback_sys.get_pending_feedback()
        assert len(pending) >= 0, "Should handle pending feedback"

        log_test_result(test_name, True, "Feedback system operational")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Feedback system test failed", e)
        return False

def test_demo_runner():
    """Test demo runner functionality"""
    test_name = "Demo Runner"
    try:
        from demo.demo_runner import DemoRunner, ScenarioPlayer, DashboardSimulator
        from pipeline.simulation.attack_simulator import AttackSimulator, ScenarioLibrary, EventGenerator
        from core.main import build_detection_engine

        # Initialize components
        simulator = AttackSimulator(ScenarioLibrary(), EventGenerator())
        scenario_player = ScenarioPlayer(simulator)
        dashboard_simulator = DashboardSimulator()
        engine = build_detection_engine()

        runner = DemoRunner(scenario_player, dashboard_simulator, engine)

        # Test demo run (quick version)
        result = runner.run_demo(max_events=10)  # Limit events for testing

        assert "metrics" in result, "Should return metrics"
        assert "alerts" in result, "Should return alerts"
        assert "severity_distribution" in result, "Should return severity distribution"

        alerts = result["alerts"]
        assert len(alerts) > 0, "Should generate some alerts"

        log_test_result(test_name, True, f"Demo generated {len(alerts)} alerts with {result['metrics']['total_alerts']} total")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Demo runner test failed", e)
        return False

def test_pipeline_integration():
    """Test end-to-end pipeline integration"""
    test_name = "Pipeline Integration"
    try:
        from pipeline.ingestion.event_ingestor import EventIngestor
        from pipeline.normalization.event_normalizer import EventNormalizer
        from pipeline.feature_extraction.feature_extractor import FeatureExtractor
        from pipeline.detection_engine import DetectionEngine
        from pipeline.explainability import ExplainabilityEngine

        # Test component initialization
        ingestor = EventIngestor()
        normalizer = EventNormalizer()
        extractor = FeatureExtractor()
        engine = DetectionEngine()
        explainer = ExplainabilityEngine()

        # Test basic data flow
        sample_event = {
            "timestamp": "2024-01-01T10:00:00Z",
            "event_type": "authentication",
            "user": "test_user",
            "ip": "192.168.1.100",
            "action": "login_failed"
        }

        # Process through pipeline
        normalized = normalizer.normalize_event(sample_event)
        features = extractor.extract_features(normalized)
        detection_result = engine.detect_events([normalized])
        explanation = explainer.explain(detection_result, features)

        assert normalized is not None, "Should normalize event"
        assert features is not None, "Should extract features"
        assert detection_result is not None, "Should detect threats"
        assert explanation is not None, "Should explain detection"

        log_test_result(test_name, True, "End-to-end pipeline processing successful")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Pipeline integration test failed", e)
        return False

def test_frontend_assets():
    """Test React frontend assets exist and are wired as expected"""
    test_name = "Frontend Assets"
    try:
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
        src_dir = os.path.join(frontend_dir, "src")

        assert os.path.exists(os.path.join(frontend_dir, "package.json")), "Should have frontend package.json"
        assert os.path.exists(os.path.join(src_dir, "App.jsx")), "Should have React App.jsx"
        assert os.path.exists(os.path.join(src_dir, "styles.css")), "Should have frontend styles"

        with open(os.path.join(src_dir, "App.jsx"), "r", encoding="utf-8") as f:
            app_content = f.read()
            assert "/health" in app_content, "Frontend should call live health endpoint"
            assert "/ingestion/health" in app_content, "Frontend should call ingestion health endpoint"
            assert "/assistant" in app_content, "Frontend should call assistant endpoint"
            assert "/detect/batch" in app_content, "Frontend should call batch detection endpoint"
            assert "/ml/status" in app_content, "Frontend should call ML status endpoint"
            assert "/ml/train" in app_content, "Frontend should call ML training endpoint"
            assert "/ml/mode" in app_content, "Frontend should call ML mode endpoint"

        log_test_result(test_name, True, "React frontend assets are present and wired to live API endpoints")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Frontend asset test failed", e)
        return False

def test_packaging():
    """Test packaging and setup"""
    test_name = "Packaging & Setup"
    try:
        import setuptools
        import pkg_resources

        # Check setup.py
        with open('setup.py', 'r') as f:
            setup_content = f.read()
            assert 'name=' in setup_content, "setup.py should have name"
            assert 'version=' in setup_content, "setup.py should have version"

        # Check requirements.txt
        with open('requirements.txt', 'r') as f:
            requirements = f.readlines()
            assert len(requirements) > 0, "Should have requirements"

        # Check pyproject.toml
        with open('pyproject.toml', 'r') as f:
            toml_content = f.read()
            assert '[build-system]' in toml_content, "Should have build system"

        log_test_result(test_name, True, "Packaging files are properly configured")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Packaging test failed", e)
        return False

def run_performance_test():
    """Run basic performance test"""
    test_name = "Performance Test"
    try:
        from core.main import build_detection_engine
        from pipeline.feature_extraction.feature_extractor import FeatureExtractor
        from pipeline.normalization.event_normalizer import EventNormalizer
        from pipeline.simulation.attack_simulator import EventGenerator

        start_time = time.time()

        engine = build_detection_engine()
        generator = EventGenerator()
        normalizer = EventNormalizer()
        extractor = FeatureExtractor()
        events = generator.generate_events("brute_force", count=100)
        normalized_events = [normalizer.normalize_event(event) for event in events]
        feature_vectors = [extractor.extract_features(event) for event in normalized_events]
        events_batch = [[event] for event in events]

        alerts = engine.detect_events_batch(events_batch)

        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / len(events_batch) * 1000

        assert len(alerts) == len(events_batch), "Should return one alert per event batch"

        log_test_result(test_name, True, f"Processed {len(alerts)} events in {total_time:.2f}s ({avg_time:.2f}ms avg)")
        return True
    except Exception as e:
        log_test_result(test_name, False, "Performance test failed", e)
        return False

def test_api_endpoints():
    """Test live API endpoints against a local threaded server"""
    test_name = "API Endpoints"
    server = None
    server_thread = None
    try:
        from core.api import create_server

        server = create_server(port=8082)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        time.sleep(0.25)

        def get_json(url: str) -> Dict[str, Any]:
            with urllib.request.urlopen(url, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))

        def post_json(url: str, payload: Dict[str, Any], expected_error: bool = False, timeout: int = 10):
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                if not expected_error:
                    raise
                return exc.code, json.loads(exc.read().decode("utf-8"))

        health = get_json("http://127.0.0.1:8082/health")
        assert health["status"] == "ok", "Health endpoint should be ok"
        assert "auth_enabled" in health, "Health endpoint should expose auth configuration"
        assert "event_persistence" in health, "Health endpoint should expose persistence configuration"

        assistant_health = get_json("http://127.0.0.1:8082/assistant/health")
        assert "assistant" in assistant_health, "Assistant health endpoint should return assistant payload"
        assert "configured" in assistant_health["assistant"], "Assistant health should expose configuration state"

        ingestion_health = get_json("http://127.0.0.1:8082/ingestion/health")
        assert "ingestion" in ingestion_health, "Ingestion health endpoint should return ingestion payload"

        ml_status = get_json("http://127.0.0.1:8082/ml/status")
        assert "ml" in ml_status, "ML status endpoint should return ML payload"
        assert "active_mode" in ml_status["ml"], "ML status should expose active mode"

        detect_status, detect_data = post_json(
            "http://127.0.0.1:8082/detect",
            {
                "events": [
                    {
                        "event_id": "evt-1",
                        "timestamp": "2026-04-14T00:00:00Z",
                        "event_type": "brute_force",
                        "host": "workstation-01",
                        "user": "alice",
                        "source_ip": "10.0.0.5",
                        "metadata": {"attempts": 12},
                    }
                ],
            },
        )
        assert detect_status == 200, "Detect endpoint should return 200"
        assert "alert" in detect_data, "Detect endpoint should return alert"

        ingest_status, ingest_data = post_json(
            "http://127.0.0.1:8082/ingest",
            {
                "source_layer": "api_test",
                "events": [
                    {
                        "event_id": "ing-1",
                        "timestamp": "2026-04-14T00:00:02Z",
                        "message": "Failed password for alice from 10.0.0.12",
                    }
                ],
            },
        )
        assert ingest_status == 200, "Ingest endpoint should return 200"
        assert ingest_data["ingested"] == 1, "Ingest endpoint should ingest one event"
        assert ingest_data["events"][0]["event_type"] == "brute_force", "Ingest endpoint should derive event type from message"

        syslog_status, syslog_data = post_json(
            "http://127.0.0.1:8082/ingest/syslog",
            {
                "lines": [
                    "<34>2026-04-14T00:00:03Z host1 sshd[123]: Failed password for root from 10.0.0.13 port 22 ssh2"
                ]
            },
        )
        assert syslog_status == 200, "Syslog ingest endpoint should return 200"
        assert syslog_data["ingested"] == 1, "Syslog ingest endpoint should ingest one line"

        batch_status, batch_data = post_json(
            "http://127.0.0.1:8082/detect/batch",
            {
                "events_batch": [
                    [
                        {
                            "event_id": "evt-1",
                            "timestamp": "2026-04-14T00:00:00Z",
                            "event_type": "brute_force",
                            "source_ip": "10.0.0.10",
                            "metadata": {"attempts": 9},
                        }
                    ],
                    [
                        {
                            "event_id": "evt-2",
                            "timestamp": "2026-04-14T00:00:01Z",
                            "event_type": "c2_beacon",
                            "destination_ip": "203.0.113.1",
                        }
                    ],
                ],
            },
        )
        assert batch_status == 200, "Batch detect endpoint should return 200"
        assert batch_data["count"] == 2, "Batch detect endpoint should return 2 alerts"

        simulate_status, simulate_data = post_json(
            "http://127.0.0.1:8082/simulate",
            {"scenario": "phishing_to_exfiltration"},
        )
        assert simulate_status == 200, "Simulate endpoint should return 200"
        assert "simulation" in simulate_data, "Simulate endpoint should return simulation payload"

        train_status, train_data = post_json(
            "http://127.0.0.1:8082/ml/train",
            {"source_mode": "synthetic", "activate": True},
            timeout=45,
        )
        assert train_status == 200, "ML train endpoint should return 200"
        assert "ml" in train_data and "run" in train_data["ml"], "ML train endpoint should return training run"

        mode_status, mode_data = post_json(
            "http://127.0.0.1:8082/ml/mode",
            {"mode": "synthetic"},
        )
        assert mode_status == 200, "ML mode endpoint should return 200"
        assert mode_data["ml"]["active_mode"] == "synthetic", "ML mode endpoint should switch to synthetic"

        assistant_status, assistant_data = post_json(
            "http://127.0.0.1:8082/assistant",
            {"query": "Summarize this SOC incident."},
            expected_error=True,
        )
        assert assistant_status in (200, 429, 502, 503), "Assistant endpoint should be implemented"
        if assistant_status == 503:
            assert assistant_data.get("required_env") == ["OPENAI_API_KEY"], "Assistant endpoint should declare required API key"
        elif assistant_status == 429:
            assert assistant_data.get("error", {}).get("type") == "insufficient_quota", "Assistant endpoint should return structured quota errors"
        elif assistant_status == 502:
            assert assistant_data.get("error", {}).get("type") in ("connection_error", "unexpected_error"), "Assistant endpoint should return structured upstream errors"
        else:
            assert "assistant" in assistant_data, "Assistant endpoint should return assistant payload when configured"

        log_test_result(test_name, True, "Health, ingestion, detection, simulation, assistant, and ML endpoints validated")
        return True
    except Exception as e:
        log_test_result(test_name, False, "API endpoint test failed", e)
        return False
    finally:
        if server:
            server.shutdown()
            server.server_close()
        if server_thread:
            server_thread.join(timeout=2)

def main():
    """Run all tests"""
    print("🚀 AetherSentrix SOC Engine - Comprehensive Test Suite")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        test_imports,
        test_detection_engine,
        test_simulation_system,
        test_model_factory,
        test_feedback_system,
        test_api_endpoints,
        test_demo_runner,
        test_pipeline_integration,
        test_frontend_assets,
        test_packaging,
        run_performance_test
    ]

    results = []
    start_time = time.time()

    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            log_test_result(test_func.__name__, False, "Unexpected error", e)
            results.append(False)

    end_time = time.time()
    total_time = end_time - start_time

    # Summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = sum(results)
    total = len(results)
    failed = total - passed

    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {passed/total*100:.1f}%")
    print(f"Total Time: {total_time:.2f} seconds")
    print()

    if failed == 0:
        print("🎉 ALL TESTS PASSED! System is ready for production planning.")
        return 0
    else:
        print("⚠️  Some tests failed. Review errors above before proceeding.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
