#!/usr/bin/env python3
"""
Quick validation script for AetherSentrix readiness.

This script is intended as a lightweight confidence check for the demo stack.
It does not replace full production certification, security review, or load
testing.
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def check_imports():
    """Check if all modules can be imported"""
    try:
        from main import build_detection_engine
        from pipeline.model_factory import ModelFactory
        from pipeline.simulation.attack_simulator import AttackSimulator
        from demo.demo_runner import DemoRunner
        print("✅ All core modules import successfully")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def check_models():
    """Check if models are real or mock"""
    try:
        from pipeline.model_factory import ModelFactory
        factory = ModelFactory()

        # Check if models have real implementations
        anomaly_detector = factory.create_anomaly_detector()
        classifier = factory.create_classifier()

        # Simple heuristic: real models should have more complex structure
        anomaly_methods = [m for m in dir(anomaly_detector) if not m.startswith('_')]
        classifier_methods = [m for m in dir(classifier) if not m.startswith('_')]

        if len(anomaly_methods) > 3 and len(classifier_methods) > 3:
            print("✅ Models appear to have substantial implementations")
            return True
        else:
            print("⚠️ Models may be simplified/mocked")
            return False
    except Exception as e:
        print(f"❌ Model check error: {e}")
        return False

def check_simulation():
    """Check simulation capabilities"""
    try:
        from pipeline.simulation.attack_simulator import ScenarioLibrary
        library = ScenarioLibrary()
        scenarios = library.get_scenarios()

        scenario_count = len(scenarios)
        print(f"📊 Found {scenario_count} attack scenarios")

        if scenario_count >= 2:
            print("✅ Basic simulation framework present")
            return True
        else:
            print("⚠️ Limited simulation scenarios")
            return False
    except Exception as e:
        print(f"❌ Simulation check error: {e}")
        return False

def check_api():
    """Check if API endpoints exist"""
    api_files = ['api.py', 'app.py', 'server.py', 'main_api.py']
    api_found = any(os.path.exists(f) for f in api_files)

    if api_found:
        print("✅ API files found")
        return True
    else:
        print("❌ No API endpoints detected")
        return False

def check_tests():
    """Check for test files"""
    test_files = [f for f in os.listdir('.') if f.startswith('test') and f.endswith('.py')]
    if test_files:
        print(f"✅ Found {len(test_files)} test files")
        return True
    else:
        print("❌ No test files found")
        return False

def main():
    print("🔍 AetherSentrix Readiness Check")
    print("=" * 50)

    checks = [
        ("Module Imports", check_imports),
        ("ML Models", check_models),
        ("Attack Simulation", check_simulation),
        ("API Endpoints", check_api),
        ("Unit Tests", check_tests)
    ]

    results = []
    for name, check_func in checks:
        print(f"\n🔍 Checking {name}...")
        result = check_func()
        results.append(result)

    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)

    passed = sum(results)
    total = len(results)

    print(f"Checks Passed: {passed}/{total}")

    if passed == total:
        print("🎉 System is validated and ready for production planning.")
    elif passed >= total * 0.6:
        print("⚠️ System is partially validated but still needs production work.")
    else:
        print("❌ Significant readiness gaps identified.")

    print("\n📋 Next Steps:")
    print("1. Run: python test_all_features.py")
    print("2. Review: PRODUCTION_READINESS_PLAN.md")
    print("3. Implement missing components")

if __name__ == "__main__":
    main()
