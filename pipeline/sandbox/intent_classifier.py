"""
Intent Classifier
==================
Takes the final state of a sandbox session and classifies its intent:

    HACKER         — clear malicious signals, high confidence
    LEGIT_ANOMALY  — anomalous but benign (false positive)
    UNCERTAIN      — not enough signal; keep observing

Decision matrix:

    injection OR escalation                    → HACKER
    stop_after_failure AND no injection        → LEGIT_ANOMALY
    trust_score < 0.30 AND breadth > 10        → HACKER
    trust_score > 0.65                         → LEGIT_ANOMALY
    otherwise                                  → UNCERTAIN
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .session_tracker import SandboxSession


class IntentLabel(str, Enum):
    HACKER        = "HACKER"
    LEGIT_ANOMALY = "LEGIT_ANOMALY"
    UNCERTAIN     = "UNCERTAIN"


@dataclass
class ClassificationResult:
    session_id: str
    label: IntentLabel
    confidence: float           # 0.0–1.0
    explanation: str

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "label": self.label.value,
            "confidence": round(self.confidence, 3),
            "explanation": self.explanation,
        }


class IntentClassifier:
    """
    Classifies a sandbox session's intent from its accumulated state.

    Usage::

        clf = IntentClassifier()
        result = clf.classify(session)
    """

    def classify(self, session: SandboxSession) -> ClassificationResult:
        score = session.current_trust_score
        inject = session.injection_attempts
        escalate = session.privilege_escalation_attempts
        breadth = len(session.unique_paths)
        auth_fail = session.auth_failures

        # --- Definitive HACKER signals ---
        if inject > 0 or escalate > 0:
            label = IntentLabel.HACKER
            confidence = min(0.99, 0.70 + inject * 0.10 + escalate * 0.15)
            explanation = (
                "Session flagged as HACKER. "
                + (f"Detected {inject} payload injection attempt(s). " if inject else "")
                + (f"Detected {escalate} privilege escalation attempt(s). " if escalate else "")
            )
            session.intent_label = label.value
            return ClassificationResult(session.session_id, label, confidence, explanation)

        if score < 0.30 and breadth >= 10:
            label = IntentLabel.HACKER
            confidence = 0.80
            explanation = (
                f"Session flagged as HACKER. Trust score critically low ({score:.2f}) "
                f"with broad endpoint sweep ({breadth} unique paths)."
            )
            session.intent_label = label.value
            return ClassificationResult(session.session_id, label, confidence, explanation)

        # --- Definitive LEGIT signals ---
        if score >= 0.65:
            label = IntentLabel.LEGIT_ANOMALY
            confidence = min(0.95, score)
            explanation = (
                f"Session reclassified as LEGIT_ANOMALY. "
                f"Trust score recovered to {score:.2f}. "
                "Behaviour consistent with a legitimate user experiencing an anomalous event."
            )
            session.intent_label = label.value
            return ClassificationResult(session.session_id, label, confidence, explanation)

        stop_after_fail = (
            auth_fail >= 2
            and not escalate
            and inject == 0
            and score >= 0.45
        )
        if stop_after_fail:
            label = IntentLabel.LEGIT_ANOMALY
            confidence = 0.70
            explanation = (
                "Session reclassified as LEGIT_ANOMALY. "
                "User stopped escalating after authentication failures — "
                "typical of a legitimate user who mistyped credentials."
            )
            session.intent_label = label.value
            return ClassificationResult(session.session_id, label, confidence, explanation)

        # --- UNCERTAIN ---
        label = IntentLabel.UNCERTAIN
        confidence = 0.50
        explanation = (
            f"Insufficient signal to classify intent (trust_score={score:.2f}, "
            f"breadth={breadth}, injections={inject}, escalations={escalate}). "
            "Recommend continued sandbox observation or human review."
        )
        session.intent_label = label.value
        return ClassificationResult(session.session_id, label, confidence, explanation)
