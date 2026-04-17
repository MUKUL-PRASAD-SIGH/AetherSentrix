"""
Trust Engine — Aggregator
==========================
Combines all four trust-scoring layers into a single, weighted
``trust_score`` for a session.

    trust_score = w1*context + w2*behaviour + w3*spike + w4*intent

Weights reflect the relative importance of each layer:
    context    0.20  (static facts — useful but easiest to spoof)
    behaviour  0.30  (historical deviation — harder to fake)
    spike      0.20  (burst detection — real-time signal)
    intent     0.30  (explicit hacker-curiosity — strongest signal)

The result also carries a human-readable ``risk_summary`` that the
explainability engine can use directly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .context_scorer import ContextScorer, SessionContext, ContextScore
from .behavioral_scorer import BehaviouralScorer, BehaviourObservation, BehaviourScore
from .spike_scorer import SpikeScorer, SpikeObservation, SpikeScore
from .intent_signals import IntentSignalDetector, IntentObservation, IntentScore


# ---------------------------------------------------------------------------
# Weights
# ---------------------------------------------------------------------------

WEIGHTS = {
    "context":   0.20,
    "behaviour": 0.30,
    "spike":     0.20,
    "intent":    0.30,
}


# ---------------------------------------------------------------------------
# Unified input bundle
# ---------------------------------------------------------------------------

@dataclass
class TrustInput:
    """All information needed to score a session."""
    context: SessionContext
    behaviour: BehaviourObservation
    spikes: SpikeObservation
    intent: IntentObservation


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

@dataclass
class TrustResult:
    """Full trust evaluation for a session."""
    session_id: str
    trust_score: float                       # 0.0 (malicious) → 1.0 (trusted)
    context_score: float = 1.0
    behaviour_score: float = 1.0
    spike_score: float = 1.0
    intent_score: float = 1.0
    all_flags: List[str] = field(default_factory=list)
    risk_summary: str = ""

    # Raw sub-scores for UI display
    context_detail: Optional[ContextScore] = None
    behaviour_detail: Optional[BehaviourScore] = None
    spike_detail: Optional[SpikeScore] = None
    intent_detail: Optional[IntentScore] = None

    @property
    def label(self) -> str:
        if self.trust_score >= 0.70:
            return "LEGIT"
        if self.trust_score >= 0.40:
            return "SUSPICIOUS"
        return "MALICIOUS"

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "trust_score": round(self.trust_score, 4),
            "label": self.label,
            "layer_scores": {
                "context":   round(self.context_score, 4),
                "behaviour": round(self.behaviour_score, 4),
                "spike":     round(self.spike_score, 4),
                "intent":    round(self.intent_score, 4),
            },
            "risk_flags": self.all_flags,
            "risk_summary": self.risk_summary,
        }


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class TrustEngine:
    """
    Orchestrates the four-layer trust scoring pipeline.

    Usage::

        engine = TrustEngine()
        result = engine.evaluate(session_id="sess-001", inputs=trust_input)
        print(result.label, result.trust_score)
    """

    def __init__(self) -> None:
        self._ctx_scorer  = ContextScorer()
        self._beh_scorer  = BehaviouralScorer()
        self._spk_scorer  = SpikeScorer()
        self._int_scorer  = IntentSignalDetector()

    # ------------------------------------------------------------------

    def evaluate(self, session_id: str, inputs: TrustInput) -> TrustResult:
        """Run all four layers and return a TrustResult."""

        ctx = self._ctx_scorer.score(inputs.context)
        beh = self._beh_scorer.score(inputs.behaviour)
        spk = self._spk_scorer.score(inputs.spikes)
        itn = self._int_scorer.score(inputs.intent)

        weighted = (
            WEIGHTS["context"]   * ctx.baseline_trust_score
            + WEIGHTS["behaviour"] * beh.behaviour_trust_score
            + WEIGHTS["spike"]     * spk.spike_trust_score
            + WEIGHTS["intent"]    * itn.intent_trust_score
        )
        trust_score = round(max(0.05, min(1.0, weighted)), 4)

        # Collect all risk flags
        all_flags = (
            ctx.risk_flags
            + beh.risk_flags
            + spk.risk_flags
            + itn.risk_flags
        )

        risk_summary = self._build_summary(trust_score, all_flags)

        return TrustResult(
            session_id=session_id,
            trust_score=trust_score,
            context_score=ctx.baseline_trust_score,
            behaviour_score=beh.behaviour_trust_score,
            spike_score=spk.spike_trust_score,
            intent_score=itn.intent_trust_score,
            all_flags=all_flags,
            risk_summary=risk_summary,
            context_detail=ctx,
            behaviour_detail=beh,
            spike_detail=spk,
            intent_detail=itn,
        )

    # ------------------------------------------------------------------

    @staticmethod
    def _build_summary(score: float, flags: List[str]) -> str:
        if not flags:
            return "No risk indicators detected. Session appears legitimate."
        flag_lines = "\n  - ".join(flags)
        label = (
            "HIGH likelihood of malicious intent"
            if score < 0.40 else
            "MODERATE suspicion — further monitoring recommended"
        )
        return (
            f"Trust score: {score:.2f} → {label}\n"
            f"Risk indicators:\n  - {flag_lines}"
        )
