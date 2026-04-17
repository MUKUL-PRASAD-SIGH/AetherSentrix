"""
Behaviour Analyzer
===================
Runs continuously on a sandboxed session's request log.
Updates suspicion flags and the session's current_trust_score
after each batch of new requests.

Signals monitored:
  1. Endpoint breadth growth (recon sweep)
  2. Injection attempts in payloads
  3. 401/403 storm (auth probing)
  4. Stop-after-failure pattern (legit user)
  5. Escalating after failure (attacker)
  6. High request velocity
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import List, Optional

from .session_tracker import SandboxSession, SandboxRequestLog


# ---------------------------------------------------------------------------
# Injection patterns (same set as intent_signals for consistency)
# ---------------------------------------------------------------------------

_INJECTION_RE = re.compile(
    r"(?i)(union\s+select|drop\s+table|'\s*or\s+'1'='1"
    r"|<script|javascript:|onerror=|\.\.\/|%2e%2e"
    r"|exec\s*\(|system\s*\(|eval\s*\()",
)

_HIGH_PRIV_PATHS = {
    "/admin", "/admin/data", "/admin/export", "/admin/users",
    "/config", "/v1/models/switch", "/sandbox/decision", "/ml/train",
}


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

@dataclass
class BehaviourAnalysis:
    session_id: str
    evaluated_at: float = field(default_factory=time.time)
    updated_trust_score: float = 1.0

    # Signals
    endpoint_breadth: int = 0
    injection_attempts: int = 0
    auth_failure_count: int = 0
    stop_after_failure: bool = False        # legit signal
    escalation_after_failure: bool = False  # attacker signal
    request_velocity_rpm: float = 0.0

    # Summary
    risk_flags: List[str] = field(default_factory=list)
    narrative: str = ""

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "evaluated_at": self.evaluated_at,
            "updated_trust_score": round(self.updated_trust_score, 4),
            "endpoint_breadth": self.endpoint_breadth,
            "injection_attempts": self.injection_attempts,
            "auth_failure_count": self.auth_failure_count,
            "stop_after_failure": self.stop_after_failure,
            "escalation_after_failure": self.escalation_after_failure,
            "request_velocity_rpm": round(self.request_velocity_rpm, 2),
            "risk_flags": self.risk_flags,
            "narrative": self.narrative,
        }


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------

class BehaviourAnalyzer:
    """
    Evaluates a SandboxSession's request log and returns a BehaviourAnalysis.
    Also mutates ``session.current_trust_score`` in place.

    Usage::

        analyzer = BehaviourAnalyzer()
        analysis = analyzer.analyze(session)
    """

    FLOOR = 0.05

    def analyze(self, session: SandboxSession) -> BehaviourAnalysis:
        logs = session.request_logs
        result = BehaviourAnalysis(session_id=session.session_id)

        if not logs:
            result.narrative = "No requests observed yet."
            return result

        deduction = 0.0

        # 1. Endpoint breadth
        unique_paths = {r.path for r in logs}
        result.endpoint_breadth = len(unique_paths)
        if result.endpoint_breadth >= 8:
            deduction += 0.20
            result.risk_flags.append(
                f"endpoint_breadth_scan({result.endpoint_breadth}_unique_paths)"
            )

        # 2. Injection attempts
        inj_count = sum(
            1 for r in logs
            if _INJECTION_RE.search(r.payload_snippet or "")
        )
        result.injection_attempts = inj_count
        session.injection_attempts = inj_count
        if inj_count > 0:
            deduction += min(0.40, inj_count * 0.20)
            result.risk_flags.append(f"injection_attempt(x{inj_count})")

        # 3. Auth failures
        auth_failures = sum(1 for r in logs if r.status_code in (401, 403))
        result.auth_failure_count = auth_failures
        if auth_failures >= 5:
            deduction += 0.15
            result.risk_flags.append(f"auth_failure_storm({auth_failures})")

        # 4. Stop-after-failure vs escalation
        last_n = logs[-5:]  # look at tail
        if auth_failures >= 3:
            tail_successes = any(r.status_code == 200 for r in last_n)
            tail_high_priv = any(r.path in _HIGH_PRIV_PATHS for r in last_n)

            if tail_successes and tail_high_priv:
                result.escalation_after_failure = True
                session.privilege_escalation_attempts += 1
                deduction += 0.25
                result.risk_flags.append("escalation_after_auth_failure")
            elif not tail_successes:
                result.stop_after_failure = True
                # Legit users stop — reward (small positive adjustment)
                deduction -= 0.05

        # 5. Request velocity
        if len(logs) >= 2:
            window_secs = logs[-1].timestamp - logs[0].timestamp
            if window_secs > 0:
                result.request_velocity_rpm = (len(logs) / window_secs) * 60
                if result.request_velocity_rpm > 120:   # 2 req/sec avg
                    deduction += 0.15
                    result.risk_flags.append(
                        f"high_velocity({result.request_velocity_rpm:.0f}_rpm)"
                    )

        # Final score (blend with existing trust score, not replace)
        blended = session.current_trust_score - deduction
        result.updated_trust_score = max(self.FLOOR, blended)
        session.current_trust_score = result.updated_trust_score

        result.narrative = self._build_narrative(result, session)
        return result

    # ------------------------------------------------------------------

    @staticmethod
    def _build_narrative(analysis: BehaviourAnalysis, session: SandboxSession) -> str:
        parts = []
        if analysis.stop_after_failure:
            parts.append("User stopped after authentication failures — consistent with a legitimate user.")
        if analysis.escalation_after_failure:
            parts.append("User escalated to privileged endpoints after auth failures — strong attacker signal.")
        if analysis.injection_attempts:
            parts.append(f"Detected {analysis.injection_attempts} injection attempt(s) in request payloads.")
        if analysis.endpoint_breadth >= 8:
            parts.append(f"User accessed {analysis.endpoint_breadth} distinct endpoints — recon-style sweep.")
        if analysis.auth_failure_count >= 5:
            parts.append(f"{analysis.auth_failure_count} authentication failures in this session.")
        if analysis.request_velocity_rpm > 120:
            parts.append(f"Request rate {analysis.request_velocity_rpm:.0f} req/min exceeds normal thresholds.")

        if not parts:
            return "Behaviour within expected parameters. Continue monitoring."
        return " ".join(parts)
