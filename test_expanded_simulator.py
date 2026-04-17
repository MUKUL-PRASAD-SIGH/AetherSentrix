#!/usr/bin/env python3
"""
Validation script for the expanded attack simulator.
"""

import time

from pipeline.simulation.attack_simulator import AttackSimulator, EventGenerator, ScenarioLibrary


def test_expanded_simulator():
    simulator = AttackSimulator(ScenarioLibrary(), EventGenerator())
    scenario_map = simulator.scenario_library.get_scenarios()
    scenario_names = list(scenario_map.keys())

    print(f"Total scenarios available: {len(scenario_names)}")
    print("Sample scenarios:")
    for index, scenario_name in enumerate(scenario_names[:5], start=1):
        scenario = scenario_map[scenario_name]
        print(f"{index}. {scenario_name} - {scenario['description']}")

    print("\nTesting event generation:")
    test_events = ["phishing_click", "malware_execution", "credential_theft", "network_scan", "data_exfiltration"]
    for event_type in test_events:
        event = simulator.event_generator.generate_event(event_type, time.time())
        print(f"{event_type}: {event['action']} -> {event['outcome']}")

    print("\nTesting full scenario execution:")
    if scenario_names:
        scenario_name = scenario_names[0]
        print(f"Running scenario: {scenario_name}")
        report = simulator.run_simulation(scenario_name)
        print(f"Generated {report['events_generated']} events")
        if report["events"]:
            first_event = report["events"][0]
            print(f"First event: {first_event['event_type']} -> {first_event['action']}")


if __name__ == "__main__":
    test_expanded_simulator()
