"""
Ambiguous Session Handler
=========================
Solves the hardest edge case in deception security:

    Two users hit the same trigger (e.g., 10 failed logins then success).
    Surface signals are IDENTICAL.
    Hidden intents are completely different:
        - User A: Real user who forgot their password repeatedly.
        - User B: Attacker running a credential-stuffing tool.

The system CANNOT tell them apart at login time.

SOLUTION — Suspicion-Blind Universal Containment:
    - When a trigger fires, BOTH users are routed to the sandbox.
    - Neither gets real access immediately.
    - The sandbox watches what they do AFTER authentication.
    - Post-auth behavior diverges fast:
        * Dumb user:    goes straight to their normal task → stops → exits.
        * Attacker:     probes endpoints, injects payloads, escalates privileges.
    - The divergence is the real signal.

This is not punishment — the sandbox is an observation chamber.
A real user gets a slight delay and eventually gets real access.
The attacker is stuck in honey forever, feeding us intelligence.

Key principle:
    Pre-auth signals classify → Ambiguous? → Sandbox everyone.
    Post-auth signals differentiate → Divergence detected → Classify & act.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class DivergenceLabel(str, Enum):
    """Post-auth behavioral classification label."""
    CONFIRMED_HACKER    = "CONFIRMED_HACKER"     # Probing, injection, escalation
    CONFIRMED_LEGIT     = "CONFIRMED_LEGIT"       # Normal task, no probing, exits cleanly
    UNCERTAIN_MONITOR   = "UNCERTAIN_MONITOR"     # Not enough data yet — keep watching
    AMBIGUOUS_ESCALATE  = "AMBIGUOUS_ESCALATE"    # Mixed signals — human review needed


@dataclass
class PostAuthEvent:
    """A single observed action from inside the sandbox."""
    timestamp: float
    action_type: str           # e.g. "endpoint_probe", "payload_inject", "normal_read", "logout"
    endpoint: str = "/"
    payload_snippet: str = ""
    status_code: int = 200
    is_suspicious: bool = False


@dataclass
class AmbiguousSession:
    """
    Represents a session that was sandboxed due to identical surface behavior.
    Tracks post-auth actions and computes the divergence score continuously.
    """
    session_id: str
    user_id: Optional[str]
    source_ip: str
    trigger_reason: str        # Why it was ambiguous (e.g. "10_failures_then_success")
    created_at: float = field(default_factory=time.time)

    post_auth_events: List[PostAuthEvent] = field(default_factory=list)

    # Divergence counters
    suspicious_action_count: int = 0
    normal_action_count: int = 0
    unique_endpoints_probed: int = 0
    injection_attempts: int = 0
    escalation_attempts: int = 0

    # Session state
    label: DivergenceLabel = DivergenceLabel.UNCERTAIN_MONITOR
    divergence_score: float = 0.5   # 0.0 = clearly legit, 1.0 = clearly hacker
    analyst_note: str = ""
    resolved: bool = False

    # Divergence thresholds
    HACKER_THRESHOLD: float = 0.72
    LEGIT_THRESHOLD: float = 0.28
    MIN_EVENTS_TO_DECIDE: int = 3

    def record_event(self, event: PostAuthEvent) -> None:
        """Record a new post-auth event and recompute divergence score."""
        self.post_auth_events.append(event)

        if event.is_suspicious:
            self.suspicious_action_count += 1
        else:
            self.normal_action_count += 1

        # Track unique endpoint probing
        probed = {e.endpoint for e in self.post_auth_events if e.is_suspicious}
        self.unique_endpoints_probed = len(probed)

        # Track injection and escalation
        if event.action_type == "payload_inject":
            self.injection_attempts += 1
        if event.action_type == "privilege_escalation":
            self.escalation_attempts += 1

        self._recompute_divergence()

    def _recompute_divergence(self) -> None:
        """
        Compute the divergence score using a weighted signal combination.

        Score components:
            1. Suspicious ratio         — weight 0.30
            2. Endpoint breadth         — weight 0.25  (recon is hacker-typical)
            3. Injection attempts       — weight 0.30
            4. Escalation attempts      — weight 0.15
        """
        total = self.suspicious_action_count + self.normal_action_count
        if total == 0:
            return

        suspicious_ratio = self.suspicious_action_count / total

        # Normalize breadth (>= 6 unique endpoints is a strong recon signal)
        breadth_score = min(1.0, self.unique_endpoints_probed / 6.0)

        # Normalize injection (>= 3 = critical signal)
        injection_score = min(1.0, self.injection_attempts / 3.0)

        # Normalize escalation (any = strong signal)
        escalation_score = min(1.0, self.escalation_attempts / 1.0)

        self.divergence_score = (
            0.30 * suspicious_ratio
            + 0.25 * breadth_score
            + 0.30 * injection_score
            + 0.15 * escalation_score
        )

        # Only commit to a label once we have enough evidence
        if len(self.post_auth_events) < self.MIN_EVENTS_TO_DECIDE:
            self.label = DivergenceLabel.UNCERTAIN_MONITOR
            return

        if self.divergence_score >= self.HACKER_THRESHOLD:
            self.label = DivergenceLabel.CONFIRMED_HACKER
            self.resolved = True
        elif self.divergence_score <= self.LEGIT_THRESHOLD:
            self.label = DivergenceLabel.CONFIRMED_LEGIT
            self.resolved = True
        else:
            # Mixed signals — flag for analyst
            self.label = DivergenceLabel.AMBIGUOUS_ESCALATE

    def summary(self) -> str:
        """Human-readable one-liner for SOC dashboards."""
        return (
            f"[{self.label.value}] session={self.session_id[:8]}… "
            f"user={self.user_id or 'unknown'} ip={self.source_ip} "
            f"divergence={self.divergence_score:.2f} "
            f"events={len(self.post_auth_events)} "
            f"injections={self.injection_attempts} "
            f"breadth={self.unique_endpoints_probed}"
        )

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "source_ip": self.source_ip,
            "trigger_reason": self.trigger_reason,
            "label": self.label.value,
            "divergence_score": round(self.divergence_score, 4),
            "suspicious_actions": self.suspicious_action_count,
            "normal_actions": self.normal_action_count,
            "unique_endpoints_probed": self.unique_endpoints_probed,
            "injection_attempts": self.injection_attempts,
            "escalation_attempts": self.escalation_attempts,
            "event_count": len(self.post_auth_events),
            "resolved": self.resolved,
            "analyst_note": self.analyst_note,
            "created_at": self.created_at,
        }


class AmbiguousSessionRegistry:
    """
    In-memory registry for ambiguous sessions.
    In production, back this with Redis for cross-node consistency.
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, AmbiguousSession] = {}

    def create_session(
        self,
        user_id: Optional[str],
        source_ip: str,
        trigger_reason: str,
    ) -> AmbiguousSession:
        """
        Sandboxes a session as ambiguous.
        Both the hacker and the dumb-user get the same treatment here.
        """
        session_id = str(uuid.uuid4())
        session = AmbiguousSession(
            session_id=session_id,
            user_id=user_id,
            source_ip=source_ip,
            trigger_reason=trigger_reason,
        )
        self._sessions[session_id] = session
        return session

    def record_event(self, session_id: str, event: PostAuthEvent) -> Optional[AmbiguousSession]:
        """Record a post-auth action and return the updated session."""
        session = self._sessions.get(session_id)
        if not session:
            return None
        session.record_event(event)
        return session

    def get(self, session_id: str) -> Optional[AmbiguousSession]:
        return self._sessions.get(session_id)

    def list_unresolved(self) -> List[AmbiguousSession]:
        return [s for s in self._sessions.values() if not s.resolved]

    def list_all(self) -> List[AmbiguousSession]:
        return list(self._sessions.values())

    def resolve(self, session_id: str, note: str = "") -> Optional[AmbiguousSession]:
        session = self._sessions.get(session_id)
        if session:
            session.resolved = True
            session.analyst_note = note
        return session


# Module-level singleton
_registry_instance: Optional[AmbiguousSessionRegistry] = None


def get_ambiguous_registry() -> AmbiguousSessionRegistry:
    """Return the global AmbiguousSessionRegistry singleton."""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = AmbiguousSessionRegistry()
    return _registry_instance
