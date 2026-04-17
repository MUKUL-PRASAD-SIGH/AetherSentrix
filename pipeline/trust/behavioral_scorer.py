"""
Layer 2 — Behavioural Pattern Scorer
======================================
Compares the *current* session's behaviour metrics against the
user's historical baseline.  Detects:

  • Unusual data-transfer volume (e.g. admin normally 100 MB → now 5 GB)
  • Unusually high request frequency
  • Accessing endpoints never visited before
  • Operating at an unusual time of day

Returns a behaviour_trust_score in [0.0, 1.0].
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Baseline registry (in production: fetched from a time-series DB)
# ---------------------------------------------------------------------------

# user_id → historical profile
_BASELINE_PROFILES: Dict[str, "UserBaseline"] = {}


@dataclass
class UserBaseline:
    """Historical norms for a single user."""
    user_id: str
    avg_transfer_mb: float = 50.0          # average MB per session
    std_transfer_mb: float = 20.0          # standard deviation
    avg_requests_per_min: float = 10.0
    std_requests_per_min: float = 5.0
    known_endpoints: List[str] = field(default_factory=list)
    typical_hours: List[int] = field(default_factory=lambda: list(range(8, 19)))  # 8am-7pm


def register_baseline(baseline: UserBaseline) -> None:
    """Register (or update) a user's behavioural baseline."""
    _BASELINE_PROFILES[baseline.user_id] = baseline


def _seed_defaults() -> None:
    """Seed a few realistic defaults for demo users."""
    for uid, avg_mb, avg_rpm in [
        ("admin",      200.0, 30.0),
        ("alice",       80.0, 12.0),
        ("bob",         60.0, 10.0),
        ("analyst",     40.0,  8.0),
        ("reader",      20.0,  5.0),
        ("integrator", 100.0, 20.0),
    ]:
        register_baseline(UserBaseline(
            user_id=uid,
            avg_transfer_mb=avg_mb,
            std_transfer_mb=avg_mb * 0.3,
            avg_requests_per_min=avg_rpm,
            std_requests_per_min=avg_rpm * 0.4,
            known_endpoints=["/detect", "/alerts", "/health", "/simulate", "/ingest"],
        ))


_seed_defaults()


# ---------------------------------------------------------------------------
# Input / Output
# ---------------------------------------------------------------------------

@dataclass
class BehaviourObservation:
    """What we observed in the current session so far."""
    user_id: Optional[str]
    transfer_mb: float = 0.0
    requests_per_min: float = 0.0
    endpoints_accessed: List[str] = field(default_factory=list)
    hour_of_day: int = 12                  # 0–23


@dataclass
class BehaviourScore:
    behaviour_trust_score: float = 1.0
    transfer_z_score: float = 0.0
    request_z_score: float = 0.0
    novel_endpoint_ratio: float = 0.0
    off_hours: bool = False
    risk_flags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "behaviour_trust_score": round(self.behaviour_trust_score, 4),
            "transfer_z_score": round(self.transfer_z_score, 3),
            "request_z_score": round(self.request_z_score, 3),
            "novel_endpoint_ratio": round(self.novel_endpoint_ratio, 3),
            "off_hours": self.off_hours,
            "risk_flags": self.risk_flags,
        }


# ---------------------------------------------------------------------------
# Scorer
# ---------------------------------------------------------------------------

class BehaviouralScorer:
    """
    Scores behavioural deviation.

    Penalisation (deductions from 1.0):
        transfer z-score > 2σ   → -0.20 per σ above 2, capped at -0.40
        request z-score > 2σ    → -0.15 per σ above 2, capped at -0.30
        novel endpoint ratio    → -0.20 if > 50 % unknown endpoints
        off-hours activity      → -0.10
    """

    FLOOR = 0.05

    def score(self, obs: BehaviourObservation) -> BehaviourScore:
        result = BehaviourScore()
        baseline = _BASELINE_PROFILES.get(obs.user_id or "") if obs.user_id else None
        deduction = 0.0

        if baseline is None:
            # No historical data — treat as moderately suspicious
            result.risk_flags.append("no_baseline_profile")
            result.behaviour_trust_score = 0.5
            return result

        # 1. Transfer volume z-score
        if baseline.std_transfer_mb > 0:
            z_transfer = (obs.transfer_mb - baseline.avg_transfer_mb) / baseline.std_transfer_mb
        else:
            z_transfer = 0.0
        result.transfer_z_score = z_transfer
        if z_transfer > 2:
            penalty = min(0.40, (z_transfer - 2) * 0.20)
            deduction += penalty
            result.risk_flags.append(f"high_transfer_volume(z={z_transfer:.2f})")

        # 2. Request frequency z-score
        if baseline.std_requests_per_min > 0:
            z_req = (obs.requests_per_min - baseline.avg_requests_per_min) / baseline.std_requests_per_min
        else:
            z_req = 0.0
        result.request_z_score = z_req
        if z_req > 2:
            penalty = min(0.30, (z_req - 2) * 0.15)
            deduction += penalty
            result.risk_flags.append(f"high_request_rate(z={z_req:.2f})")

        # 3. Novel endpoints
        total = len(obs.endpoints_accessed)
        if total > 0:
            novel = sum(
                1 for ep in obs.endpoints_accessed
                if ep not in baseline.known_endpoints
            )
            ratio = novel / total
            result.novel_endpoint_ratio = ratio
            if ratio > 0.5:
                deduction += 0.20
                result.risk_flags.append(f"novel_endpoint_ratio({ratio:.0%})")
        else:
            result.novel_endpoint_ratio = 0.0

        # 4. Off-hours
        if obs.hour_of_day not in baseline.typical_hours:
            deduction += 0.10
            result.off_hours = True
            result.risk_flags.append(f"off_hours(hour={obs.hour_of_day})")

        result.behaviour_trust_score = max(self.FLOOR, 1.0 - deduction)
        return result
