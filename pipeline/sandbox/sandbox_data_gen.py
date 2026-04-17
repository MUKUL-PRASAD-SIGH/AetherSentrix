"""
Sandbox Data Generator
=======================
Generates realistic-looking but entirely fake data that the honey API
serves to sandboxed sessions.  The goal: the attacker believes they are
operating on a real system long enough to reveal their full intent.

All returned objects are dicts / lists — ready to be JSON-serialised.
"""

from __future__ import annotations

import random
import string
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _rand_ip() -> str:
    return ".".join(str(random.randint(10, 200)) for _ in range(4))


def _rand_hash(n: int = 16) -> str:
    return "".join(random.choices(string.hexdigits[:16], k=n))


def _rand_ts(days_ago: int = 30) -> str:
    dt = datetime.utcnow() - timedelta(days=random.randint(0, days_ago))
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _rand_username() -> str:
    return random.choice([
        "jsmith", "a.patel", "r.wong", "m.brown", "svc-backup",
        "svc-monitor", "l.garcia", "deploy-bot", "k.lee", "t.miller",
    ])


# ---------------------------------------------------------------------------
# Fake data generators
# ---------------------------------------------------------------------------

class SandboxDataGen:

    # --- Users / IAM ---

    @staticmethod
    def fake_user_list(count: int = 10) -> List[Dict[str, Any]]:
        roles = ["admin", "analyst", "reader", "developer", "svc"]
        users = []
        for i in range(count):
            users.append({
                "id": str(uuid.uuid4()),
                "username": _rand_username(),
                "role": random.choice(roles),
                "last_login": _rand_ts(7),
                "mfa_enabled": random.choice([True, False]),
                "status": random.choice(["active", "active", "inactive"]),
            })
        return users

    # --- Data export ---

    @staticmethod
    def fake_export_data(rows: int = 20) -> List[Dict[str, Any]]:
        """Looks like a real database export — contains no actual sensitive data."""
        data = []
        for _ in range(rows):
            data.append({
                "record_id": str(uuid.uuid4()),
                "user": _rand_username(),
                "action": random.choice(["login", "file_access", "api_call", "logout"]),
                "resource": f"/data/{_rand_hash(8)}",
                "timestamp": _rand_ts(90),
                "source_ip": _rand_ip(),
                "result": random.choice(["success", "success", "success", "failure"]),
            })
        return data

    # --- Config / secrets (all fake) ---

    @staticmethod
    def fake_config() -> Dict[str, Any]:
        return {
            "db_host": f"db-{_rand_hash(4)}.internal",
            "db_port": 5432,
            "db_name": "prod_aether",
            "api_key": f"sk-{''.join(random.choices(string.ascii_letters, k=32))}",
            "jwt_secret": _rand_hash(48),
            "redis_url": f"redis://cache-{_rand_hash(4)}.internal:6379",
            "feature_flags": {
                "enable_audit_log": True,
                "sandbox_mode": False,
                "rate_limiting": True,
            },
        }

    # --- Alerts (fake) ---

    @staticmethod
    def fake_alerts(count: int = 5) -> List[Dict[str, Any]]:
        categories = ["brute_force", "c2_beacon", "lateral_movement", "normal_traffic"]
        alerts = []
        for _ in range(count):
            alerts.append({
                "alert_id": f"fake-{uuid.uuid4().hex[:8]}",
                "timestamp": _rand_ts(2),
                "threat_category": random.choice(categories),
                "severity": random.choice(["low", "medium", "high"]),
                "source_ip": _rand_ip(),
                "risk_score": round(random.uniform(10, 90), 1),
                "status": "open",
            })
        return alerts

    # --- Models ---

    @staticmethod
    def fake_model_list() -> List[Dict[str, Any]]:
        return [
            {
                "model_id": f"model-{_rand_hash(6)}",
                "type": t,
                "version": f"1.{random.randint(0, 9)}.{random.randint(0, 9)}",
                "accuracy": round(random.uniform(0.85, 0.98), 3),
                "last_trained": _rand_ts(30),
                "status": "active",
            }
            for t in ["anomaly_detector", "threat_classifier", "ensemble"]
        ]

    # --- Generic 404-like fake error ---

    @staticmethod
    def fake_not_found(resource: str) -> Dict[str, Any]:
        return {
            "error": "not_found",
            "message": f"Resource '{resource}' does not exist.",
            "request_id": uuid.uuid4().hex,
        }
