from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


class FeedbackCollector:
    def __init__(self):
        self.feedback_store = []

    def collect_feedback(self, alert_id: str, analyst_rating: str, comments: str = "") -> Dict[str, Any]:
        feedback = {
            "feedback_id": f"fb-{len(self.feedback_store) + 1}",
            "alert_id": alert_id,
            "analyst_rating": analyst_rating,
            "comments": comments,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        self.feedback_store.append(feedback)
        return feedback

    def get_pending_feedback(self) -> List[Dict[str, Any]]:
        return [fb for fb in self.feedback_store if fb["analyst_rating"] == "pending"]


class ModelRetrainer:
    def __init__(self):
        self.model_version = "v1.0"

    def retrain(self, feedback_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        false_positives = len([fb for fb in feedback_data if fb["analyst_rating"] == "false_positive"])
        true_positives = len([fb for fb in feedback_data if fb["analyst_rating"] == "true_positive"])
        confirmed = false_positives + true_positives

        precision_signal = true_positives / confirmed if confirmed else 0.0
        correction_signal = false_positives / max(len(feedback_data), 1)
        improvement = round((precision_signal * 0.1) + (correction_signal * 0.1), 3)

        version_number = float(self.model_version[1:]) if self.model_version.startswith("v") else float(self.model_version)
        self.model_version = f"v{int(version_number) + 1}.0"

        return {
            "new_model_version": self.model_version,
            "performance_improvement": improvement,
            "false_positives_corrected": false_positives,
            "true_positives_confirmed": true_positives,
            "training_data_added": len(feedback_data),
        }


class PerformanceMonitor:
    def evaluate(self, simulation_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_simulations = len(simulation_results)
        if total_simulations == 0:
            return {
                "total_simulations": 0,
                "average_detection_rate": 0.0,
                "average_false_positives": 0.0,
                "overall_performance": "insufficient_data",
            }

        avg_detection_rate = sum(r.get("detection_success_rate", 0) for r in simulation_results) / total_simulations
        avg_false_positives = sum(r.get("false_positives", 0) for r in simulation_results) / total_simulations

        return {
            "total_simulations": total_simulations,
            "average_detection_rate": avg_detection_rate,
            "average_false_positives": avg_false_positives,
            "overall_performance": "good" if avg_detection_rate > 0.8 else "needs_improvement",
        }


class FeedbackSystem:
    def __init__(self):
        self.collector = FeedbackCollector()
        self.retrainer = ModelRetrainer()
        self.monitor = PerformanceMonitor()

    def add_feedback(self, alert_id: str, analyst_rating: str, analyst_id: str = "", comments: str = "") -> Dict[str, Any]:
        feedback = self.collector.collect_feedback(alert_id, analyst_rating, comments)
        if analyst_rating in ["false_positive", "true_positive"]:
            retrain_result = self.retrainer.retrain([feedback])
            return {"feedback": feedback, "retrain": retrain_result}
        return {"feedback": feedback}

    def get_pending_feedback(self) -> List[Dict[str, Any]]:
        return self.collector.get_pending_feedback()

    def process_feedback(self, alert_id: str, analyst_rating: str, comments: str = "") -> Dict[str, Any]:
        return self.add_feedback(alert_id, analyst_rating, comments=comments)
