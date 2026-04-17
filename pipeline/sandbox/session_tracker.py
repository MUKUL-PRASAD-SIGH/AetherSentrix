"""
Sandbox Session Tracker
========================
Maintains the state of every sandboxed session:
  • When the session was quarantined
  • What actions the user has taken inside the sandbox
  • Current sandbox-internal trust score (updated continuously)
  • Analyst verdict (if one has been submitted)

All data is in-memory with a dict keyed by session_id.
Replace with Redis / DB for production.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Analyst verdict options
# ---------------------------------------------------------------------------

VERDICT_ALLOW   = "ALLOW"
VERDICT_BLOCK   = "BLOCK"
VERDICT_MONITOR = "MONITOR"


# ---------------------------------------------------------------------------
# Per-request log entry inside the sandbox
# ---------------------------------------------------------------------------

@dataclass
class SandboxRequestLog:
    timestamp: float
    method: str
    path: str
    status_code: int
    payload_snippet: str = ""
    is_suspicious: bool = False
    suspicion_reason: str = ""


# ---------------------------------------------------------------------------
# Sandbox session
# ---------------------------------------------------------------------------

@dataclass
class SandboxSession:
    session_id: str
    user_id: Optional[str]
    source_ip: str
    sandboxed_at: float = field(default_factory=time.time)
    initial_trust_score: float = 0.45
    current_trust_score: float = 0.45

    # Running behaviour log
    request_logs: List[SandboxRequestLog] = field(default_factory=list)

    # Aggregated counters (updated on every log_request call)
    total_requests: int = 0
    suspicious_requests: int = 0
    unique_paths: set = field(default_factory=set)
    auth_failures: int = 0
    injection_attempts: int = 0
    privilege_escalation_attempts: int = 0

    # Analyst decision
    analyst_verdict: Optional[str] = None
    analyst_note: str = ""
    verdict_at: Optional[float] = None

    # Intent classification result
    intent_label: Optional[str] = None     # HACKER | LEGIT_ANOMALY | UNCERTAIN

    # ------------------------------------------------------------------

    def log_request(self, log: SandboxRequestLog) -> None:
        self.request_logs.append(log)
        self.total_requests += 1
        self.unique_paths.add(log.path)

        if log.is_suspicious:
            self.suspicious_requests += 1

        if log.status_code in (401, 403):
            self.auth_failures += 1

    def record_analyst_verdict(
        self, verdict: str, note: str = ""
    ) -> None:
        assert verdict in (VERDICT_ALLOW, VERDICT_BLOCK, VERDICT_MONITOR), \
            f"Invalid verdict: {verdict}"
        self.analyst_verdict = verdict
        self.analyst_note = note
        self.verdict_at = time.time()

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "source_ip": self.source_ip,
            "sandboxed_at": self.sandboxed_at,
            "initial_trust_score": round(self.initial_trust_score, 4),
            "current_trust_score": round(self.current_trust_score, 4),
            "total_requests": self.total_requests,
            "suspicious_requests": self.suspicious_requests,
            "unique_paths_count": len(self.unique_paths),
            "auth_failures": self.auth_failures,
            "injection_attempts": self.injection_attempts,
            "privilege_escalation_attempts": self.privilege_escalation_attempts,
            "intent_label": self.intent_label,
            "analyst_verdict": self.analyst_verdict,
            "analyst_note": self.analyst_note,
            "request_log_count": len(self.request_logs),
        }


# ---------------------------------------------------------------------------
# Tracker (singleton-style registry)
# ---------------------------------------------------------------------------

class SandboxSessionTracker:
    """
    Central registry of all active / past sandbox sessions.

    Usage::

        tracker = SandboxSessionTracker()
        session = tracker.create("sess-001", user_id="alice", source_ip="203.0.113.5")
        session.log_request(SandboxRequestLog(...))
        tracker.get("sess-001")
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, SandboxSession] = {}

    # ------------------------------------------------------------------

    def create(
        self,
        session_id: str,
        user_id: Optional[str],
        source_ip: str,
        initial_trust_score: float = 0.45,
    ) -> SandboxSession:
        session = SandboxSession(
            session_id=session_id,
            user_id=user_id,
            source_ip=source_ip,
            initial_trust_score=initial_trust_score,
            current_trust_score=initial_trust_score,
        )
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> Optional[SandboxSession]:
        return self._sessions.get(session_id)

    def is_sandboxed(self, session_id: str) -> bool:
        return session_id in self._sessions

    def list_active(self) -> List[SandboxSession]:
        """Sessions without a final analyst verdict."""
        return [
            s for s in self._sessions.values()
            if s.analyst_verdict is None
        ]

    def list_all(self) -> List[SandboxSession]:
        return list(self._sessions.values())

    def submit_analyst_verdict(
        self, session_id: str, verdict: str, note: str = ""
    ) -> Optional[SandboxSession]:
        session = self.get(session_id)
        if session:
            session.record_analyst_verdict(verdict, note)
        return session

    def all_as_dicts(self) -> List[dict]:
        return [s.to_dict() for s in self._sessions.values()]


# Module-level singleton (imported by api_v2.py and sandbox_router.py)
_tracker = SandboxSessionTracker()


def get_tracker() -> SandboxSessionTracker:
    return _tracker
