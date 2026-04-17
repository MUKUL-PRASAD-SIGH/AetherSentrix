"""
Honey API
==========
Returns fake-but-believable responses for every route that a real API
would serve.  Sandboxed sessions are silently routed here; they receive
realistic data but never touch the actual system.

Usage (from sandbox_router.py or api_v2.py middleware):

    honey = HoneyAPI()
    response_body, status_code = honey.respond(method, path, body)
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, Optional, Tuple

from .sandbox_data_gen import SandboxDataGen


class HoneyAPI:
    """
    Maps (method, path) to a plausible fake response.
    Unknown routes return a generic 200 or 404.
    """

    _gen = SandboxDataGen()

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def respond(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], int]:
        """
        Returns (response_dict, http_status_code).
        All responses are completely fabricated.
        """
        method = method.upper()
        # Normalise trailing slashes
        clean = path.rstrip("/") or "/"

        # --- Auth ---
        if clean == "/login" and method == "POST":
            return self._fake_login(body), 200

        # --- Health ---
        if clean == "/health":
            return self._fake_health(), 200

        # --- Detection ---
        if clean == "/detect" and method == "POST":
            return self._fake_detect(), 200
        if clean == "/detect/batch" and method == "POST":
            return self._fake_batch_detect(), 200

        # --- Alerts ---
        if clean == "/alerts/recent":
            return {"alerts": self._gen.fake_alerts(8)}, 200
        if clean.startswith("/v1/alerts/") and method == "GET":
            return self._gen.fake_alerts(1)[0], 200
        if clean == "/v1/alerts" and method == "GET":
            return {"alerts": self._gen.fake_alerts(5), "total": 5}, 200

        # --- Admin / sensitive ---
        if clean in ("/admin/data", "/admin/export", "/admin"):
            return {"data": self._gen.fake_export_data(15)}, 200
        if clean == "/admin/users":
            return {"users": self._gen.fake_user_list(12)}, 200

        # --- Config / secrets (honey-grade fake) ---
        if clean == "/config":
            return {"config": self._gen.fake_config()}, 200

        # --- Models ---
        if clean in ("/v1/models/active", "/ml/status"):
            return {"models": self._gen.fake_model_list()}, 200
        if clean == "/v1/models/switch" and method == "POST":
            return {"status": "success", "message": "Model switched."}, 200

        # --- Simulation ---
        if clean == "/simulate" and method == "POST":
            return self._fake_simulation(), 200

        # --- Scenarios ---
        if clean == "/scenarios":
            return {"scenarios": [
                {"name": "brute_force", "description": "Credential stuffing scenario"},
                {"name": "c2_beacon", "description": "Command and control beaconing"},
            ]}, 200

        # --- Sandbox decision (echo back) ---
        if clean == "/sandbox/decision" and method == "POST":
            return {"status": "received", "request_id": uuid.uuid4().hex}, 200

        # Fallback
        return self._gen.fake_not_found(path), 404

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _fake_login(body: Optional[Dict]) -> Dict:
        username = (body or {}).get("username", "user")
        return {
            "access_token": f"eyJ.{uuid.uuid4().hex}.{uuid.uuid4().hex}",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {"username": username, "role": "analyst"},
        }

    @staticmethod
    def _fake_health() -> Dict:
        return {
            "status": "ok",
            "service": "AetherSentrix API",
            "version": "2.1.0",
            "uptime_seconds": 86400,
        }

    @staticmethod
    def _fake_detect() -> Dict:
        import random
        return {
            "alert_id": f"fake-{uuid.uuid4().hex[:8]}",
            "is_anomaly": False,
            "threat_category": "normal_traffic",
            "risk_score": round(random.uniform(5, 20), 1),
            "confidence": "low",
            "explanation": "No anomalous patterns detected in this event.",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    @staticmethod
    def _fake_batch_detect() -> Dict:
        return {
            "count": 2,
            "alerts": [],
            "message": "Batch processed. No threats detected.",
        }

    @staticmethod
    def _fake_simulation() -> Dict:
        return {
            "simulation": {
                "scenario": "brute_force",
                "events_generated": 12,
                "duration_seconds": 15,
                "status": "complete",
            }
        }
