"""
Sandbox Router
===============
Middleware-level component: inspects every incoming request and decides
whether it should be routed to the real system or the honey API.

Integration with FastAPI (api_v2.py):
  - Instantiate ``SandboxRouter`` once at startup.
  - Call ``router.route(request, session_id)`` in a middleware or dependency.
  - If it returns ``(True, body, code)`` → return the honey response immediately.
  - Otherwise let the request proceed to the real handler.

Routing decision rules:
    1. If session_id is tracked as SANDBOXED     → route to honey
    2. If trust_score is below SANDBOX threshold → create sandbox, route to honey
    3. Otherwise                                  → let through
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, Optional, Tuple

from .session_tracker import SandboxSessionTracker, SandboxSession, SandboxRequestLog, get_tracker
from .honey_api import HoneyAPI
from .behavior_analyzer import BehaviourAnalyzer

# Circular-safe import (trust Decision lives in pipeline.trust)
# We accept trust_score as a float passed in from api_v2 middleware.

SANDBOX_TRUST_THRESHOLD = 0.50    # sessions below this are sandboxed


class SandboxRouter:
    """
    Intercepts requests for sessions that are in (or should be in) the sandbox.

    Usage::

        router = SandboxRouter()

        # In a FastAPI middleware:
        sandboxed, body, code = router.route(
            session_id="sess-abc",
            method="POST",
            path="/admin/export",
            payload={},
            trust_score=0.35,
            user_id="alice",
            source_ip="203.0.113.5",
        )
        if sandboxed:
            return JSONResponse(body, status_code=code)
        # else: proceed normally
    """

    def __init__(
        self,
        tracker: Optional[SandboxSessionTracker] = None,
        honey: Optional[HoneyAPI] = None,
        analyzer: Optional[BehaviourAnalyzer] = None,
    ) -> None:
        self._tracker  = tracker  or get_tracker()
        self._honey    = honey    or HoneyAPI()
        self._analyzer = analyzer or BehaviourAnalyzer()

    # ------------------------------------------------------------------

    def route(
        self,
        session_id: str,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        trust_score: float = 1.0,
        user_id: Optional[str] = None,
        source_ip: str = "0.0.0.0",
    ) -> Tuple[bool, Dict[str, Any], int]:
        """
        Returns:
            (is_sandboxed, response_body, http_status_code)

        If is_sandboxed is True the caller MUST return the honey response.
        """

        # --- Check if session is already sandboxed ---
        session = self._tracker.get(session_id)

        if session is None and trust_score < SANDBOX_TRUST_THRESHOLD:
            # Create a new sandbox session for this user
            session = self._tracker.create(
                session_id=session_id,
                user_id=user_id,
                source_ip=source_ip,
                initial_trust_score=trust_score,
            )

        if session is None:
            # Not sandboxed, let through
            return False, {}, 0

        # --- Already sandboxed (or just created) ---
        self._log_request(session, method, path, payload)
        self._analyzer.analyze(session)

        honey_body, honey_code = self._honey.respond(method, path, payload)
        return True, honey_body, honey_code

    # ------------------------------------------------------------------

    def submit_analyst_decision(
        self,
        session_id: str,
        verdict: str,
        note: str = "",
    ) -> Optional[SandboxSession]:
        """SOC analyst submits allow/block/monitor verdict."""
        return self._tracker.submit_analyst_verdict(session_id, verdict, note)

    # ------------------------------------------------------------------

    def _log_request(
        self,
        session: SandboxSession,
        method: str,
        path: str,
        payload: Optional[Dict],
    ) -> None:
        snippet = str(payload or "")[:512]
        log = SandboxRequestLog(
            timestamp=time.time(),
            method=method,
            path=path,
            status_code=200,            # will be overwritten after honey responds
            payload_snippet=snippet,
        )
        session.log_request(log)
