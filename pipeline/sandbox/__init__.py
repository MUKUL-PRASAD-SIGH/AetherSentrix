"""
pipeline/sandbox — Deception-Based Containment Environment

Modules:
    session_tracker          — Tracks which sessions are sandboxed + full behaviour log
    sandbox_data_gen         — Generates realistic fake data for honey responses
    honey_api                — Returns fake-but-believable API responses
    sandbox_router           — Decides real vs sandbox routing per request
    behavior_analyzer        — Observes sandboxed session and scores ongoing behaviour
    intent_classifier        — Final classification: HACKER | LEGIT_ANOMALY | UNCERTAIN
    ambiguous_session_handler— Edge-case: identical surface behaviour → universal containment,
                               post-auth divergence scoring to differentiate intent
"""

from .session_tracker import SandboxSessionTracker, SandboxSession
from .intent_classifier import IntentClassifier, IntentLabel
from .ambiguous_session_handler import (
    AmbiguousSessionRegistry,
    AmbiguousSession,
    DivergenceLabel,
    PostAuthEvent,
    get_ambiguous_registry,
)

__all__ = [
    "SandboxSessionTracker", "SandboxSession",
    "IntentClassifier", "IntentLabel",
    "AmbiguousSessionRegistry", "AmbiguousSession",
    "DivergenceLabel", "PostAuthEvent",
    "get_ambiguous_registry",
]
