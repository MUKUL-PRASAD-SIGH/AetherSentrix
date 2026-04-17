"""
Layer 3 — Spike / Burst Scorer (SNN-inspired)
================================================
Detects sudden *temporal bursts* in activity — login storms, API hammering,
port-scan-style endpoint sweeps — the kind of sharp spikes that Spiking
Neural Networks are naturally designed to catch.

Instead of a full SNN implementation (which would need training data),
we model the same intuition with a *leaky bucket* / *integrate-and-fire*
analogy:

  - Each event adds "charge" to the neuron potential.
  - Between events, the potential decays (leaks) exponentially.
  - If the potential crosses a threshold → a "spike" is registered.
  - The number of spikes in a window drives the score penalty.

Returns a spike_trust_score in [0.0, 1.0].
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Event timestamp feed
# ---------------------------------------------------------------------------

@dataclass
class TimestampedEvent:
    """A single timestamped action (login attempt, API call, etc.)."""
    timestamp: float           # Unix epoch seconds
    event_type: str = "api_call"


# ---------------------------------------------------------------------------
# LIF (Leaky Integrate-and-Fire) neuron  ←  the SNN analogy
# ---------------------------------------------------------------------------

class LIFNeuron:
    """
    Leaky Integrate-and-Fire neuron.

    Parameters
    ----------
    threshold : float
        Membrane potential at which a spike fires.
    leak_rate : float
        Fraction of charge that leaks per second (0 < leak_rate < 1).
    charge_per_event : float
        Charge added to membrane potential on each event.
    """

    def __init__(
        self,
        threshold: float = 3.0,
        leak_rate: float = 0.5,
        charge_per_event: float = 1.0,
    ):
        self.threshold = threshold
        self.leak_rate = leak_rate
        self.charge_per_event = charge_per_event
        self._potential: float = 0.0
        self._last_ts: Optional[float] = None
        self._spike_count: int = 0

    def process(self, ts: float) -> bool:
        """
        Feed one event at timestamp `ts`.
        Returns True if this event caused a spike.
        """
        # Apply exponential decay since last event
        if self._last_ts is not None:
            elapsed = max(0.0, ts - self._last_ts)
            self._potential *= (1.0 - self.leak_rate) ** elapsed
        self._last_ts = ts

        # Integrate charge
        self._potential += self.charge_per_event

        # Fire if threshold crossed
        if self._potential >= self.threshold:
            self._spike_count += 1
            self._potential = 0.0          # reset (refractory)
            return True
        return False

    @property
    def spike_count(self) -> int:
        return self._spike_count

    @property
    def current_potential(self) -> float:
        return self._potential

    def reset(self) -> None:
        self._potential = 0.0
        self._last_ts = None
        self._spike_count = 0


# ---------------------------------------------------------------------------
# Input / Output
# ---------------------------------------------------------------------------

@dataclass
class SpikeObservation:
    """A sequence of timestamped events from a session."""
    events: List[TimestampedEvent] = field(default_factory=list)
    window_seconds: float = 120.0       # evaluation window


@dataclass
class SpikeScore:
    spike_trust_score: float = 1.0
    spike_count: int = 0
    peak_potential: float = 0.0
    events_in_window: int = 0
    risk_flags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "spike_trust_score": round(self.spike_trust_score, 4),
            "spike_count": self.spike_count,
            "peak_potential": round(self.peak_potential, 3),
            "events_in_window": self.events_in_window,
            "risk_flags": self.risk_flags,
        }


# ---------------------------------------------------------------------------
# Scorer
# ---------------------------------------------------------------------------

class SpikeScorer:
    """
    Feeds session events through a LIF neuron and penalises based on
    the number of spikes fired.

    Penalty schedule:
        0 spikes   →  no deduction
        1–2 spikes → -0.20 per spike
        3+ spikes  → -0.35 per spike, capped at floor
    """

    FLOOR = 0.05

    def __init__(
        self,
        threshold: float = 3.0,
        leak_rate: float = 0.5,
        charge_per_event: float = 1.0,
    ):
        self.neuron_config = {
            "threshold": threshold,
            "leak_rate": leak_rate,
            "charge_per_event": charge_per_event,
        }

    def score(self, obs: SpikeObservation) -> SpikeScore:
        result = SpikeScore()
        if not obs.events:
            return result

        # Filter to events within the evaluation window
        latest_ts = obs.events[-1].timestamp
        cutoff = latest_ts - obs.window_seconds
        window_events = [e for e in obs.events if e.timestamp >= cutoff]
        result.events_in_window = len(window_events)

        neuron = LIFNeuron(**self.neuron_config)
        peak = 0.0
        for ev in sorted(window_events, key=lambda e: e.timestamp):
            neuron.process(ev.timestamp)
            peak = max(peak, neuron.current_potential)

        result.spike_count = neuron.spike_count
        result.peak_potential = peak

        # Penalty
        deduction = 0.0
        n = result.spike_count
        if 1 <= n <= 2:
            deduction = n * 0.20
            result.risk_flags.append(f"moderate_burst({n}_spikes)")
        elif n >= 3:
            deduction = min(0.95 - self.FLOOR, n * 0.35)
            result.risk_flags.append(f"severe_burst({n}_spikes)")

        # Also flag very high event density even without spikes
        if result.events_in_window > 50 and n == 0:
            deduction += 0.10
            result.risk_flags.append(f"high_event_density({result.events_in_window}_events)")

        result.spike_trust_score = max(self.FLOOR, 1.0 - deduction)
        return result
