from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def load_dotenv(path: str = ".env", override: bool = False) -> None:
    env_path = Path(path)
    if not env_path.exists() or not env_path.is_file():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"').strip("'")

        if not name:
            continue

        if override or name not in os.environ:
            os.environ[name] = value


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class RuntimeSettings:
    api_token: str | None
    rate_limit_per_minute: int
    max_body_bytes: int
    persist_events: bool
    persist_alerts: bool
    event_archive_path: str
    alert_archive_path: str


def get_runtime_settings() -> RuntimeSettings:
    load_dotenv()
    return RuntimeSettings(
        api_token=os.getenv("AETHERSENTRIX_API_TOKEN"),
        rate_limit_per_minute=max(1, _env_int("AETHERSENTRIX_RATE_LIMIT_PER_MINUTE", 240)),
        max_body_bytes=max(1024, _env_int("AETHERSENTRIX_MAX_BODY_BYTES", 1024 * 1024)),
        persist_events=_env_bool("AETHERSENTRIX_PERSIST_EVENTS", True),
        persist_alerts=_env_bool("AETHERSENTRIX_PERSIST_ALERTS", True),
        event_archive_path=os.getenv("AETHERSENTRIX_EVENT_ARCHIVE_PATH", "data/events.jsonl"),
        alert_archive_path=os.getenv("AETHERSENTRIX_ALERT_ARCHIVE_PATH", "data/alerts.jsonl"),
    )
