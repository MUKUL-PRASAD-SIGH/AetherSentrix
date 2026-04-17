from typing import Dict, Any, List
import random

class AttackerAgent:
    def generate_variant(self, base_scenario: Dict[str, Any]) -> Dict[str, Any]:
        variant = base_scenario.copy()
        # Introduce variations
        for step in variant["steps"]:
            if step["event_type"] == "c2_beacon":
                step["delay"] = random.randint(30, 60)  # Vary beacon interval
            elif step["event_type"] == "brute_force":
                step["metadata"] = {"attempts": random.randint(5, 15)}

        # Add evasion: change IP or timing
        variant["evasion"] = random.choice(["slow_beacon", "ip_rotation", "low_volume"])
        return variant

class DefenderAgent:
    def __init__(self):
        self.thresholds = {
            "login_attempt_rate": 5,
            "periodicity": 0.8,
            "outbound_bytes": 1000000
        }

    def adapt(self, simulation_results: Dict[str, Any]) -> Dict[str, Any]:
        alerts_triggered = simulation_results.get("alerts_triggered", 0)
        detection_rate = simulation_results.get("detection_success_rate", 0)

        if detection_rate < 0.7:
            # Lower thresholds to catch more
            self.thresholds["login_attempt_rate"] -= 1
            self.thresholds["periodicity"] -= 0.1

        return {
            "updated_thresholds": self.thresholds,
            "adaptation_reason": "Low detection rate" if detection_rate < 0.7 else "Maintaining performance"
        }

class GameLoop:
    def __init__(self, attacker: AttackerAgent, defender: DefenderAgent, simulator: 'AttackSimulator'):
        self.attacker = attacker
        self.defender = defender
        self.simulator = simulator
        self.rounds = []

    def run_round(self, base_scenario: Dict[str, Any]) -> Dict[str, Any]:
        variant = self.attacker.generate_variant(base_scenario)
        simulation_result = self.simulator.run_simulation(variant.get("name", "variant"))
        adaptation = self.defender.adapt(simulation_result)

        round_result = {
            "round": len(self.rounds) + 1,
            "variant": variant,
            "simulation": simulation_result,
            "adaptation": adaptation,
            "defender_improvement": adaptation.get("updated_thresholds")
        }

        self.rounds.append(round_result)
        return round_result
