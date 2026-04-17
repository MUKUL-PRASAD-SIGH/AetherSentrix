"""
pipeline/trust — Adaptive Trust Scoring & Decision Engine

Modules:
    context_scorer      — Layer 1: static context (IP, user, device, geo)
    behavioral_scorer   — Layer 2: deviation from historical behaviour
    spike_scorer        — Layer 3: SNN-inspired burst / spike detection
    intent_signals      — Layer 4: probing, escalation, hacker-curiosity patterns
    trust_engine        — Aggregator: combines all layers into a final trust_score
    decision_engine     — Thresholds + verdict (ALLOW | SANDBOX | HUMAN | BLOCK)
"""

from .trust_engine import TrustEngine, TrustResult
from .decision_engine import DecisionEngine, Decision, Verdict

__all__ = ["TrustEngine", "TrustResult", "DecisionEngine", "Decision", "Verdict"]
