"""
Layer 1 — Static Context Scorer
================================
Scores a session request purely from static, known attributes:
  • Is the user in the known-user registry?
  • Is the device fingerprint recognised?
  • Is the source IP in a known-safe range?
  • Is the geo-location consistent with past logins?

Returns a baseline_trust_score in [0.0, 1.0].
High score = more contextually trustworthy.
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Optional, Set


# ---------------------------------------------------------------------------
# Simple in-memory registries (replace with DB lookups in production)
# ---------------------------------------------------------------------------

KNOWN_USERS: Set[str] = {
    "admin", "alice", "bob", "analyst", "reader", "integrator",
}

KNOWN_DEVICE_FINGERPRINTS: Set[str] = {
    "fp-workstation-01", "fp-laptop-alice", "fp-server-infra",
}

SAFE_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
]

TRUSTED_COUNTRIES: Set[str] = {"IN", "US", "GB", "DE", "JP", "SG"}


# ---------------------------------------------------------------------------
# Input / Output dataclasses
# ---------------------------------------------------------------------------

@dataclass
class SessionContext:
    """Static attributes of an incoming session / request."""
    user_id: Optional[str] = None
    source_ip: str = "0.0.0.0"
    device_fingerprint: Optional[str] = None
    country_code: Optional[str] = None          # ISO 3166-1 alpha-2
    is_first_time_ip: bool = False
    previous_login_count: int = 0               # 0 = brand new account


@dataclass
class ContextScore:
    """Output of the context scorer for a single session."""
    baseline_trust_score: float = 1.0           # starts at max, deductions applied
    user_known: bool = False
    device_known: bool = False
    ip_safe: bool = False
    geo_trusted: bool = False
    risk_flags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "baseline_trust_score": round(self.baseline_trust_score, 4),
            "user_known": self.user_known,
            "device_known": self.device_known,
            "ip_safe": self.ip_safe,
            "geo_trusted": self.geo_trusted,
            "risk_flags": self.risk_flags,
        }


# ---------------------------------------------------------------------------
# Scorer
# ---------------------------------------------------------------------------

class ContextScorer:
    """
    Evaluates static session attributes and returns a ContextScore.

    Scoring logic (additive deductions from 1.0):
        Unknown user            → -0.25
        Unknown device          → -0.15
        Untrusted IP range      → -0.20
        First-time IP           → -0.10
        Untrusted geo           → -0.15
        Zero prior logins       → -0.05
    Minimum floor: 0.05 (we never hard-zero — let downstream layers decide).
    """

    DEDUCTIONS = {
        "unknown_user":         0.25,
        "unknown_device":       0.15,
        "untrusted_ip":         0.20,
        "first_time_ip":        0.10,
        "untrusted_geo":        0.15,
        "no_prior_logins":      0.05,
    }
    FLOOR = 0.05

    # ------------------------------------------------------------------
    def score(self, ctx: SessionContext) -> ContextScore:
        result = ContextScore()
        deduction = 0.0

        # 1. User check
        if ctx.user_id and ctx.user_id.lower() in KNOWN_USERS:
            result.user_known = True
        else:
            deduction += self.DEDUCTIONS["unknown_user"]
            result.risk_flags.append("unknown_user")

        # 2. Device check
        if ctx.device_fingerprint and ctx.device_fingerprint in KNOWN_DEVICE_FINGERPRINTS:
            result.device_known = True
        else:
            deduction += self.DEDUCTIONS["unknown_device"]
            result.risk_flags.append("unknown_device")

        # 3. IP range check
        try:
            addr = ipaddress.ip_address(ctx.source_ip)
            if any(addr in net for net in SAFE_IP_RANGES):
                result.ip_safe = True
            else:
                deduction += self.DEDUCTIONS["untrusted_ip"]
                result.risk_flags.append("untrusted_ip_range")
        except ValueError:
            deduction += self.DEDUCTIONS["untrusted_ip"]
            result.risk_flags.append("invalid_ip")

        # 4. First-time IP
        if ctx.is_first_time_ip:
            deduction += self.DEDUCTIONS["first_time_ip"]
            result.risk_flags.append("first_time_ip")

        # 5. Geo check
        if ctx.country_code and ctx.country_code.upper() in TRUSTED_COUNTRIES:
            result.geo_trusted = True
        elif ctx.country_code:
            deduction += self.DEDUCTIONS["untrusted_geo"]
            result.risk_flags.append(f"untrusted_geo:{ctx.country_code}")

        # 6. No prior logins
        if ctx.previous_login_count == 0:
            deduction += self.DEDUCTIONS["no_prior_logins"]
            result.risk_flags.append("no_prior_logins")

        result.baseline_trust_score = max(self.FLOOR, 1.0 - deduction)
        return result
