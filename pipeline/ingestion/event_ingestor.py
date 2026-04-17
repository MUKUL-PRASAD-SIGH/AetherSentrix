from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from pipeline.normalization.event_normalizer import EventNormalizer
from pipeline.storage import JsonlStore


SYSLOG_PATTERN = re.compile(
    r"^(?:<(?P<priority>\d+)>)?(?P<timestamp>\S+\s+\S+\s+\S+|\d{4}-\d{2}-\d{2}T\S+)\s+"
    r"(?P<host>\S+)\s+(?P<application>[^:\[]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.*)$"
)


class EventIngestor:
    def __init__(self, normalizer: Optional[EventNormalizer] = None, archive_store: Optional[JsonlStore] = None):
        self.normalizer = normalizer or EventNormalizer()
        self.archive_store = archive_store
        self.ingested_events: List[Dict[str, Any]] = []

    def ingest(self, raw_events: Iterable[Dict[str, Any]], source_layer: Optional[str] = None) -> List[Dict[str, Any]]:
        normalized_events = []
        for raw_event in raw_events:
            normalized_event = self.normalize_event(raw_event, source_layer=source_layer)
            normalized_events.append(normalized_event)
            self.ingested_events.append(normalized_event)

        if self.archive_store:
            self.archive_store.append_many(normalized_events)

        return normalized_events

    def ingest_jsonl_file(self, path: str, source_layer: str = "file") -> List[Dict[str, Any]]:
        raw_events = []
        for raw_line in Path(path).read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line:
                continue
            raw_events.append(json.loads(line))
        return self.ingest(raw_events, source_layer=source_layer)

    def ingest_syslog_lines(self, lines: Iterable[str], source_layer: str = "syslog") -> List[Dict[str, Any]]:
        events = [self.parse_syslog_line(line) for line in lines if str(line).strip()]
        return self.ingest(events, source_layer=source_layer)

    def parse_syslog_line(self, line: str) -> Dict[str, Any]:
        match = SYSLOG_PATTERN.match(line.strip())
        if not match:
            return {
                "event_id": self._new_event_id(),
                "timestamp": self._now_iso(),
                "source_layer": "syslog",
                "event_type": "raw_log",
                "action": "observe",
                "outcome": "unknown",
                "metadata": {"message": line.strip()},
            }

        data = match.groupdict()
        event_type, action, outcome = self._derive_syslog_semantics(data.get("message", ""))
        timestamp = self._parse_syslog_timestamp(data.get("timestamp", ""))
        metadata = {
            "message": data.get("message", ""),
            "application": (data.get("application") or "").strip(),
            "priority": data.get("priority"),
            "pid": data.get("pid"),
        }
        return {
            "event_id": self._new_event_id(),
            "timestamp": timestamp,
            "source_layer": "syslog",
            "host": data.get("host") or "unknown",
            "event_type": event_type,
            "action": action,
            "outcome": outcome,
            "metadata": metadata,
        }

    def normalize_event(self, event: Dict[str, Any], source_layer: Optional[str] = None) -> Dict[str, Any]:
        coerced_event = self._coerce_event(event, source_layer=source_layer)
        return self.normalizer.normalize_event(coerced_event)

    def get_ingested_count(self) -> int:
        return len(self.ingested_events)

    def _coerce_event(self, event: Dict[str, Any], source_layer: Optional[str]) -> Dict[str, Any]:
        metadata = event.get("metadata", {}) or {}
        coerced = dict(event)
        coerced["event_id"] = event.get("event_id") or self._new_event_id()
        coerced["timestamp"] = event.get("timestamp") or self._now_iso()
        coerced["source_layer"] = event.get("source_layer") or source_layer or metadata.get("source_layer") or "api"
        coerced["metadata"] = metadata

        if "message" in event and "message" not in metadata:
            coerced["metadata"] = {**metadata, "message": event["message"]}

        if coerced.get("event_type") in (None, "", "unknown"):
            event_type, action, outcome = self._derive_event_semantics(coerced)
            coerced["event_type"] = event_type
            coerced.setdefault("action", action)
            coerced.setdefault("outcome", outcome)

        if "action" not in coerced:
            _, action, _ = self._derive_event_semantics(coerced)
            coerced["action"] = action

        if "outcome" not in coerced:
            _, _, outcome = self._derive_event_semantics(coerced)
            coerced["outcome"] = outcome

        return coerced

    def _derive_event_semantics(self, event: Dict[str, Any]) -> tuple[str, str, str]:
        message = str((event.get("message") or event.get("metadata", {}).get("message") or "")).lower()
        action = str(event.get("action") or "observe")
        outcome = str(event.get("outcome") or "unknown")

        if "failed password" in message or "authentication failure" in message:
            return "brute_force", "login", "failure"
        if "accepted password" in message or "login succeeded" in message:
            return "successful_login", "login", "success"
        if "malware" in message or "trojan" in message:
            return "malware_infection", "execute", "success"
        if "beacon" in message or "heartbeat" in message:
            return "c2_beacon", "connect", "success"
        if event.get("outbound_bytes") or event.get("bytes_transferred"):
            return "data_exfiltration", "transfer", outcome
        return str(event.get("event_type") or "raw_event"), action, outcome

    def _derive_syslog_semantics(self, message: str) -> tuple[str, str, str]:
        return self._derive_event_semantics({"message": message})

    def _parse_syslog_timestamp(self, value: str) -> str:
        value = value.strip()
        if not value:
            return self._now_iso()

        if "T" in value:
            normalized = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(normalized).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            except ValueError:
                return self._now_iso()

        current_year = datetime.now(timezone.utc).year
        for fmt in ("%b %d %H:%M:%S", "%b %e %H:%M:%S"):
            try:
                parsed = datetime.strptime(value, fmt).replace(year=current_year, tzinfo=timezone.utc)
                return parsed.isoformat().replace("+00:00", "Z")
            except ValueError:
                continue
        return self._now_iso()

    def _new_event_id(self) -> str:
        return f"evt-{uuid.uuid4().hex[:12]}"

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
