from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List


class JsonlStore:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def append(self, record: Dict[str, Any]) -> None:
        self.append_many([record])

    def append_many(self, records: Iterable[Dict[str, Any]]) -> None:
        serialized_lines: List[str] = []
        recorded_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        for record in records:
            payload = dict(record)
            payload.setdefault("recorded_at", recorded_at)
            serialized_lines.append(json.dumps(payload, ensure_ascii=True))

        if not serialized_lines:
            return

        with self._lock:
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write("\n".join(serialized_lines) + "\n")

    def read_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        if limit <= 0 or not self.path.exists():
            return []

        with self._lock:
            lines = self.path.read_text(encoding="utf-8").splitlines()

        records: List[Dict[str, Any]] = []
        for line in lines[-limit:]:
            line = line.strip()
            if not line:
                continue
            try:
                parsed = json.loads(line)
                if isinstance(parsed, dict):
                    records.append(parsed)
            except json.JSONDecodeError:
                continue

        return records
