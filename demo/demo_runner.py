from typing import Dict, Any, List
import time
from pipeline.analytics import build_dashboard_metrics, build_severity_distribution

class ScenarioPlayer:
    def __init__(self, attack_simulator):
        self.attack_simulator = attack_simulator

    def play_scenario(self, scenario_name: str) -> List[Dict[str, Any]]:
        simulation = self.attack_simulator.run_simulation(scenario_name)
        events = simulation.get("events", [])
        return events

class DashboardSimulator:
    def __init__(self):
        self.alerts = []
        self.metrics = build_dashboard_metrics([])

    def add_alert(self, alert: Dict[str, Any]):
        self.alerts.append(alert)
        self.metrics = build_dashboard_metrics(self.alerts)

    def get_dashboard_data(self) -> Dict[str, Any]:
        return {
            "alerts": self.alerts[-10:],  # Last 10 alerts
            "metrics": self.metrics,
            "timeline": [a.get("timestamp") for a in self.alerts],
            "severity_distribution": build_severity_distribution(self.alerts)
        }

class DemoRunner:
    def __init__(self, scenario_player: ScenarioPlayer, dashboard_simulator: DashboardSimulator, detection_engine):
        self.scenario_player = scenario_player
        self.dashboard = dashboard_simulator
        self.detection_engine = detection_engine

    def run_demo(self, max_events: int = None) -> Dict[str, Any]:
        print("Starting AI-Driven Threat Detection Demo")
        print("==========================================")

        generated = 0
        event_limit = max_events or float('inf')

        # Scenario 1: Brute Force
        print("\n1. Simulating Brute Force Attack...")
        events = self.scenario_player.play_scenario("phishing_to_exfiltration")
        scenario_context = []
        for event in events:
            scenario_context.append(event)
            if generated >= event_limit:
                break
            if event.get("event_type") == "brute_force":
                alert = self.detection_engine.detect_events(scenario_context)
                self.dashboard.add_alert(alert)
                print(f"   Alert: {alert['threat_category']} - {alert['severity']} confidence")
                generated += 1

        # Scenario 2: C2 Beaconing
        print("\n2. Simulating C2 Beaconing...")
        events = self.scenario_player.play_scenario("c2_beaconing")
        scenario_context = []
        for event in events:
            scenario_context.append(event)
            if event.get("event_type") == "c2_beacon":
                alert = self.detection_engine.detect_events(scenario_context)
                self.dashboard.add_alert(alert)
                print(f"   Alert: {alert['threat_category']} - {alert['severity']} confidence")

        # False Positive
        print("\n3. Demonstrating False Positive Handling...")
        false_positive_event = {
            "event_id": "fp-001",
            "timestamp": "2026-04-14T14:00:00Z",
            "user": "admin",
            "event_type": "data_exfiltration",
            "outbound_bytes": 25000000
        }
        alert = self.detection_engine.detect_events([false_positive_event])
        self.dashboard.add_alert(alert)
        print(f"   Alert: {alert['threat_category']} - Adjusted to {alert['severity']} (admin activity)")

        dashboard_data = self.dashboard.get_dashboard_data()
        print("\nDashboard Summary:")
        print(f"   Total Alerts: {dashboard_data['metrics']['total_alerts']}")
        print(f"   Detection Rate: {dashboard_data['metrics']['detection_rate'] * 100}%")
        print(f"   High Severity: {dashboard_data['metrics']['high_severity']}")

        return dashboard_data
