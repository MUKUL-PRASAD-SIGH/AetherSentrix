"""
Layer 4 — Intent Signal Detector
==================================
Detects *hacker-curiosity* patterns — the kind of behaviour that distinguishes
an attacker from an anomalous-but-legitimate user.

Signals analysed:
  1. Endpoint breadth scan   — probing many distinct paths (recon)
  2. Privilege escalation    — accessing higher-privilege endpoints after failures
  3. Failure → success chain — repeated auth failures followed by a success (credential stuffing)
  4. Payload injection       — payloads containing SQL, script, or path-traversal fragments
  5. Sequential endpoint scan — systematic URL increment / enumeration pattern

Returns an intent_trust_score in [0.0, 1.0].
Low score = strong hacker-intent signals.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Known endpoint privilege tiers
# ---------------------------------------------------------------------------

HIGH_PRIVILEGE_ENDPOINTS = {
    "/admin", "/admin/data", "/admin/export", "/admin/users",
    "/v1/models/switch", "/sandbox/decision", "/ml/train",
    "/users/delete", "/config",
}

# ---------------------------------------------------------------------------
# Injection patterns to scan for in request payloads / query strings
# ---------------------------------------------------------------------------

INJECTION_PATTERNS: List[re.Pattern] = [
    re.compile(r"(?i)(union\s+select|drop\s+table|insert\s+into|--\s*$|'\s*or\s+'1'='1)"),
    re.compile(r"(?i)(<script|javascript:|onerror=|onload=)"),
    re.compile(r"(\.\./|\.\.\\|%2e%2e)"),                        # path traversal
    re.compile(r"(?i)(exec\s*\(|system\s*\(|eval\s*\()"),        # command injection
]


# ---------------------------------------------------------------------------
# Input / Output
# ---------------------------------------------------------------------------

@dataclass
class RequestLog:
    """A single logged HTTP request from a session."""
    path: str
    method: str = "GET"
    status_code: int = 200
    payload_snippet: str = ""       # first 512 chars of request body / query string
    privilege_level: str = "low"    # low | medium | high


@dataclass
class IntentObservation:
    """All request logs from a session for intent analysis."""
    request_logs: List[RequestLog] = field(default_factory=list)
    session_failure_count: int = 0
    session_success_after_failures: bool = False


@dataclass
class IntentScore:
    intent_trust_score: float = 1.0
    endpoint_breadth: int = 0
    privilege_escalation_detected: bool = False
    failure_success_chain: bool = False
    injection_attempts: int = 0
    sequential_scan_detected: bool = False
    risk_flags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "intent_trust_score": round(self.intent_trust_score, 4),
            "endpoint_breadth": self.endpoint_breadth,
            "privilege_escalation_detected": self.privilege_escalation_detected,
            "failure_success_chain": self.failure_success_chain,
            "injection_attempts": self.injection_attempts,
            "sequential_scan_detected": self.sequential_scan_detected,
            "risk_flags": self.risk_flags,
        }


# ---------------------------------------------------------------------------
# Scorer
# ---------------------------------------------------------------------------

class IntentSignalDetector:
    """
    Analyses request-level signals to detect attacker-style intent.

    Penalty schedule (cumulative deductions from 1.0):
        Endpoint breadth > 10 distinct paths        → -0.20
        Privilege escalation                         → -0.30
        Failure → success chain                      → -0.25
        Each injection attempt                       → -0.20 (capped at -0.40)
        Sequential scan detected                     → -0.15
    """

    FLOOR = 0.05

    # How many distinct paths == "breadth scan"
    BREADTH_THRESHOLD = 10

    # ------------------------------------------------------------------

    def score(self, obs: IntentObservation) -> IntentScore:
        result = IntentScore()
        logs = obs.request_logs

        if not logs:
            return result

        deduction = 0.0

        # 1. Endpoint breadth (recon sweep)
        distinct_paths = {r.path for r in logs}
        result.endpoint_breadth = len(distinct_paths)
        if result.endpoint_breadth >= self.BREADTH_THRESHOLD:
            deduction += 0.20
            result.risk_flags.append(f"endpoint_breadth_scan({result.endpoint_breadth}_paths)")

        # 2. Privilege escalation
        #    Pattern: 403/401 on low-priv → then tries high-priv endpoint
        failed_low = any(
            r.status_code in (401, 403) and r.path not in HIGH_PRIVILEGE_ENDPOINTS
            for r in logs
        )
        tried_high = any(r.path in HIGH_PRIVILEGE_ENDPOINTS for r in logs)
        if failed_low and tried_high:
            result.privilege_escalation_detected = True
            deduction += 0.30
            result.risk_flags.append("privilege_escalation_attempt")

        # 3. Failure → success chain (credential stuffing / brute-force success)
        if obs.session_failure_count >= 3 and obs.session_success_after_failures:
            result.failure_success_chain = True
            deduction += 0.25
            result.risk_flags.append(
                f"failure_success_chain({obs.session_failure_count}_failures_then_success)"
            )

        # 4. Injection attempts
        injection_count = 0
        for r in logs:
            for pattern in INJECTION_PATTERNS:
                if pattern.search(r.payload_snippet):
                    injection_count += 1
                    break   # count per-request, not per-pattern
        result.injection_attempts = injection_count
        if injection_count > 0:
            penalty = min(0.40, injection_count * 0.20)
            deduction += penalty
            result.risk_flags.append(f"injection_attempt(x{injection_count})")

        # 5. Sequential scan (URL enumeration)
        #    Simple heuristic: many paths that differ by only a trailing digit
        numeric_paths = [r.path for r in logs if re.search(r"\d+$", r.path)]
        if len(numeric_paths) >= 5:
            result.sequential_scan_detected = True
            deduction += 0.15
            result.risk_flags.append(f"sequential_url_scan({len(numeric_paths)}_numeric_paths)")

        result.intent_trust_score = max(self.FLOOR, 1.0 - deduction)
        return result
