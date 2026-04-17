"""
Decision Engine
================
Converts a TrustResult into a concrete operational verdict.

Verdict table
─────────────
  trust_score ≥ 0.70  → ALLOW        (real access granted)
  0.50 ≤ score < 0.70  → HUMAN        (require MFA / analyst approval)
  0.30 ≤ score < 0.50  → SANDBOX      (keep in deception environment, observe)
  score < 0.30         → BLOCK        (terminate session, alert SOC)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional

from .trust_engine import TrustResult


class Verdict(str, Enum):
    ALLOW   = "ALLOW"
    HUMAN   = "HUMAN"      # human-in-the-loop required
    SANDBOX = "SANDBOX"
    BLOCK   = "BLOCK"


@dataclass
class Decision:
    """Operational decision for a session."""
    session_id: str
    verdict: Verdict
    trust_score: float
    reasoning: str
    suggested_actions: List[str] = field(default_factory=list)
    escalate_to_soc: bool = False

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "verdict": self.verdict.value,
            "trust_score": round(self.trust_score, 4),
            "reasoning": self.reasoning,
            "suggested_actions": self.suggested_actions,
            "escalate_to_soc": self.escalate_to_soc,
        }


class DecisionEngine:
    """
    Applies threshold rules to a TrustResult and produces a Decision.

    Usage::

        engine = DecisionEngine()
        decision = engine.decide(trust_result)
    """

    THRESHOLDS = {
        "allow":   0.70,
        "human":   0.50,
        "sandbox": 0.30,
        # below 0.30 → BLOCK
    }

    def decide(self, result: TrustResult) -> Decision:
        score = result.trust_score

        if score >= self.THRESHOLDS["allow"]:
            return Decision(
                session_id=result.session_id,
                verdict=Verdict.ALLOW,
                trust_score=score,
                reasoning=(
                    f"Trust score {score:.2f} is above the ALLOW threshold (0.70). "
                    "Session context, behaviour, and intent all appear consistent with "
                    "a legitimate user."
                ),
                suggested_actions=["grant_real_access"],
                escalate_to_soc=False,
            )

        if score >= self.THRESHOLDS["human"]:
            return Decision(
                session_id=result.session_id,
                verdict=Verdict.HUMAN,
                trust_score=score,
                reasoning=(
                    f"Trust score {score:.2f} is uncertain (0.50–0.70). "
                    "Anomalies detected but not conclusive. "
                    "Routing to human analyst for approval."
                ),
                suggested_actions=[
                    "prompt_mfa",
                    "flag_for_analyst_review",
                    "log_session_in_full",
                ],
                escalate_to_soc=True,
            )

        if score >= self.THRESHOLDS["sandbox"]:
            return Decision(
                session_id=result.session_id,
                verdict=Verdict.SANDBOX,
                trust_score=score,
                reasoning=(
                    f"Trust score {score:.2f} indicates suspicious activity (0.30–0.50). "
                    "Session redirected to deception sandbox. "
                    "Behaviour will be observed and scored before a final verdict."
                ),
                suggested_actions=[
                    "route_to_sandbox",
                    "start_behavior_analyzer",
                    "notify_analyst",
                    "log_all_requests",
                ],
                escalate_to_soc=True,
            )

        # score < 0.30 → BLOCK
        return Decision(
            session_id=result.session_id,
            verdict=Verdict.BLOCK,
            trust_score=score,
            reasoning=(
                f"Trust score {score:.2f} is critically low (< 0.30). "
                "Multiple high-confidence malicious-intent signals detected. "
                "Session terminated immediately."
            ),
            suggested_actions=[
                "terminate_session",
                "block_ip",
                "create_soc_incident",
                "preserve_forensic_log",
            ],
            escalate_to_soc=True,
        )
