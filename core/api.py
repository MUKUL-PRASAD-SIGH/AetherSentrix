from __future__ import annotations

import hmac
import json
import mimetypes
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Deque, Dict, List, Tuple
from urllib.parse import unquote

from demo.demo_runner import DashboardSimulator, DemoRunner, ScenarioPlayer
from .main import build_detection_engine, refresh_detection_engine
from pipeline.config import get_runtime_settings
from pipeline.ingestion.event_ingestor import EventIngestor
from pipeline.llm import LLMConfigurationError, LLMAssistantError, SOCAssistant
from pipeline.mlops import get_model_manager
from pipeline.simulation.attack_simulator import AttackSimulator, EventGenerator, ScenarioLibrary
from pipeline.storage import JsonlStore

HOST = "127.0.0.1"
PORT = 8080

settings = get_runtime_settings()
engine = build_detection_engine()
model_manager = get_model_manager()
scenario_library = ScenarioLibrary()
event_generator = EventGenerator()
simulator = AttackSimulator(scenario_library, event_generator)
assistant = SOCAssistant()
event_store = JsonlStore(settings.event_archive_path) if settings.persist_events else None
alert_store = JsonlStore(settings.alert_archive_path) if settings.persist_alerts else None
ingestor = EventIngestor(archive_store=event_store)
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def _sandbox_session_payload(session_id: str) -> tuple[Dict[str, Any] | None, int]:
    from pipeline.explainability import ExplainabilityEngine
    from pipeline.sandbox.intent_classifier import IntentClassifier
    from pipeline.sandbox.session_tracker import get_tracker

    session = get_tracker().get(session_id)
    if not session:
        return None, 404

    intent = IntentClassifier().classify(session)
    explanation = ExplainabilityEngine().explain_sandbox_decision(
        trust_result={"trust_score": session.current_trust_score, "label": intent.label.value, "risk_flags": []},
        sandbox_session=session.to_dict(),
        intent_classification=intent.to_dict(),
    )
    return {
        "session": session.to_dict(),
        "intent_classification": intent.to_dict(),
        "explanation": explanation,
    }, 200


class InMemoryRateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self._buckets: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - 60
        bucket = self._buckets[key]

        while bucket and bucket[0] < window_start:
            bucket.popleft()

        if len(bucket) >= self.requests_per_minute:
            retry_after = max(1, int(60 - (now - bucket[0])))
            return False, retry_after

        bucket.append(now)
        return True, 0


rate_limiter = InMemoryRateLimiter(settings.rate_limit_per_minute)


class AetherSentrixThreadingHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 128


class AetherSentrixAPIHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _cors_headers(self) -> Dict[str, str]:
        origin = self.headers.get("Origin", "*")
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

    def _send_json(self, payload: Dict[str, Any], status: int = 200, extra_headers: Dict[str, str] | None = None):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        headers = {**self._cors_headers(), **(extra_headers or {})}
        for header, value in headers.items():
            self.send_header(header, value)
        self.end_headers()
        self.wfile.write(encoded)

    def _send_error(self, message: str, status: int, error_type: str = "request_error", details: Dict[str, Any] | None = None, extra_headers: Dict[str, str] | None = None):
        self._send_json(
            {"error": {"message": message, "type": error_type, "details": details or {}}},
            status=status,
            extra_headers=extra_headers,
        )

    def _send_bytes(self, content: bytes, content_type: str, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        for header, value in self._cors_headers().items():
            self.send_header(header, value)
        self.end_headers()
        self.wfile.write(content)

    def _try_serve_frontend(self) -> bool:
        if not frontend_dist.exists():
            return False

        path_only = self.path.partition("?")[0]
        request_path = unquote(path_only.lstrip("/"))
        if not request_path:
            candidate = frontend_dist / "index.html"
        else:
            candidate = (frontend_dist / request_path).resolve()
            try:
                candidate.relative_to(frontend_dist.resolve())
            except ValueError:
                return False

        if candidate.is_file():
            content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
            self._send_bytes(candidate.read_bytes(), content_type)
            return True

        if "." not in request_path:
            index_file = frontend_dist / "index.html"
            if index_file.exists():
                self._send_bytes(index_file.read_bytes(), "text/html; charset=utf-8")
                return True

        return False

    def do_OPTIONS(self):
        self.send_response(204)
        for header, value in self._cors_headers().items():
            self.send_header(header, value)
        self.end_headers()

    def _read_json_body(self) -> Tuple[Dict[str, Any] | None, str | None]:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > settings.max_body_bytes:
            return None, f"Request body exceeds configured limit of {settings.max_body_bytes} bytes"

        body = self.rfile.read(content_length).decode("utf-8")
        if len(body.encode("utf-8")) > settings.max_body_bytes:
            return None, f"Request body exceeds configured limit of {settings.max_body_bytes} bytes"

        try:
            return json.loads(body or "{}"), None
        except json.JSONDecodeError:
            return None, "Invalid JSON body"

    def _authenticate(self) -> tuple[bool, Dict[str, Any] | None]:
        if not settings.api_token:
            return True, None

        authorization = self.headers.get("Authorization", "")
        prefix = "Bearer "
        if not authorization.startswith(prefix):
            return False, {"message": "Missing bearer token.", "type": "authentication_error"}

        provided = authorization[len(prefix):].strip()
        if not hmac.compare_digest(provided, settings.api_token):
            return False, {"message": "Invalid bearer token.", "type": "authentication_error"}

        return True, None

    def _rate_limit(self) -> tuple[bool, int]:
        client_ip = self.client_address[0] if self.client_address else "unknown"
        return rate_limiter.allow(client_ip)

    def _persist_alerts(self, alerts: List[Dict[str, Any]]) -> None:
        if alert_store:
            alert_store.append_many(alerts)

    def _require_api_access(self) -> bool:
        allowed, retry_after = self._rate_limit()
        if not allowed:
            self._send_error(
                "Rate limit exceeded.",
                status=429,
                error_type="rate_limit",
                details={"retry_after_seconds": retry_after},
                extra_headers={"Retry-After": str(retry_after)},
            )
            return False

        authenticated, auth_error = self._authenticate()
        if not authenticated:
            self._send_error(auth_error["message"], status=401, error_type=auth_error["type"])
            return False

        return True

    def do_GET(self):
        if self.path == "/health":
            self._send_json(
                {
                    "status": "ok",
                    "service": "AetherSentrix API",
                    "auth_enabled": bool(settings.api_token),
                    "rate_limit_per_minute": settings.rate_limit_per_minute,
                    "max_body_bytes": settings.max_body_bytes,
                    "event_persistence": bool(event_store),
                    "alert_persistence": bool(alert_store),
                }
            )
        elif self.path == "/assistant/health":
            self._send_json({"assistant": assistant.get_health()})
        elif self.path == "/ingestion/health":
            self._send_json(
                {
                    "ingestion": {
                        "ingested_events": ingestor.get_ingested_count(),
                        "event_archive_path": settings.event_archive_path if event_store else None,
                        "alert_archive_path": settings.alert_archive_path if alert_store else None,
                    }
                }
            )
        elif self.path == "/scenarios":
            scenarios = scenario_library.get_scenarios()
            self._send_json(
                {
                    "scenarios": [
                        {
                            "name": name,
                            "description": details.get("description"),
                            "mitre_tactics": details.get("mitre_tactics", []),
                            "mitre_techniques": details.get("mitre_techniques", []),
                            "steps": len(details.get("steps", [])),
                        }
                        for name, details in scenarios.items()
                    ]
                }
            )
        elif self.path == "/v1/sandbox/sessions":
            from pipeline.sandbox.session_tracker import get_tracker

            tracker = get_tracker()
            self._send_json({"sessions": tracker.all_as_dicts(), "total": len(tracker.list_all())})
        elif self.path.startswith("/v1/sandbox/sessions/"):
            session_id = self.path.partition("?")[0].rsplit("/", 1)[-1]
            payload, status = _sandbox_session_payload(session_id)
            if payload is None:
                self._send_json({"error": "Sandbox session not found"}, status=status)
            else:
                self._send_json(payload, status=status)
        elif self.path == "/ml/status":
            self._send_json({"ml": model_manager.get_status()})
        elif self.path.startswith("/alerts/recent"):
            limit = self._parse_limit(default=50)
            alerts = alert_store.read_recent(limit) if alert_store else []
            self._send_json({"alerts": alerts, "count": len(alerts)})
        elif self.path.startswith("/events/recent"):
            limit = self._parse_limit(default=50)
            events = event_store.read_recent(limit) if event_store else []
            self._send_json({"events": events, "count": len(events)})
        elif self._try_serve_frontend():
            return
        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_POST(self):
        global engine
        if not self._require_api_access():
            return

        request_data, error = self._read_json_body()
        if error:
            self._send_error(error, status=413 if "exceeds" in error else 400, error_type="invalid_request")
            return

        if self.path == "/ingest":
            events = request_data.get("events", [])
            source_layer = request_data.get("source_layer")
            normalized_events = ingestor.ingest(events, source_layer=source_layer)
            self._send_json({"ingested": len(normalized_events), "events": normalized_events[:5]})
        elif self.path == "/ingest/syslog":
            lines = request_data.get("lines", [])
            source_layer = request_data.get("source_layer", "syslog")
            normalized_events = ingestor.ingest_syslog_lines(lines, source_layer=source_layer)
            self._send_json({"ingested": len(normalized_events), "events": normalized_events[:5]})
        elif self.path == "/detect":
            feature_vector = request_data.get("feature_vector")
            events = request_data.get("events", [])
            if events:
                normalized_events = ingestor.ingest(events, source_layer=request_data.get("source_layer"))
                alert = engine.detect_events(normalized_events, feature_vector)
            else:
                alert = engine.detect(feature_vector or {}, [])
            self._persist_alerts([alert])
            self._send_json({"alert": alert})
        elif self.path == "/detect/batch":
            feature_vectors = request_data.get("feature_vectors")
            events_batch = request_data.get("events_batch")
            if events_batch:
                normalized_batch = [
                    ingestor.ingest(events, source_layer=request_data.get("source_layer"))
                    for events in events_batch
                ]
                alerts = engine.detect_events_batch(normalized_batch, feature_vectors)
            else:
                alerts = engine.detect_batch(feature_vectors or [], events_batch)
            self._persist_alerts(alerts)
            self._send_json({"alerts": alerts, "count": len(alerts)})
        elif self.path == "/demo/run":
            scenario_player = ScenarioPlayer(simulator)
            dashboard_simulator = DashboardSimulator()
            runner = DemoRunner(scenario_player, dashboard_simulator, engine)
            dashboard_data = runner.run_demo()
            self._persist_alerts(dashboard_data.get("alerts", []))
            self._send_json({"dashboard": dashboard_data})
        elif self.path == "/simulate":
            scenario = request_data.get("scenario", "phishing_to_exfiltration")
            report = simulator.run_simulation(scenario)
            self._send_json({"simulation": report})
        elif self.path == "/assistant":
            try:
                response = assistant.answer_query(
                    query=request_data.get("query", ""),
                    alert=request_data.get("alert"),
                    alerts=request_data.get("alerts"),
                    system_context=request_data.get("system_context"),
                )
                self._send_json({"assistant": response})
            except LLMConfigurationError as exc:
                self._send_json(
                    {
                        "error": str(exc),
                        "required_env": ["OPENAI_API_KEY"],
                        "optional_env": ["OPENAI_MODEL", "OPENAI_RESPONSES_URL"],
                    },
                    status=503,
                )
            except LLMAssistantError as exc:
                status = exc.status_code or 502
                self._send_json({"error": exc.to_dict()}, status=status)
            except Exception as exc:
                self._send_json(
                    {
                        "error": {
                            "message": "The assistant failed unexpectedly.",
                            "type": "unexpected_error",
                            "details": {"technical_reason": str(exc)},
                        }
                    },
                    status=502,
                )
        elif self.path == "/ml/train":
            try:
                result = model_manager.train(
                    source_mode=request_data.get("source_mode", "synthetic"),
                    dataset_name=request_data.get("dataset_name"),
                    dataset_path=request_data.get("dataset_path"),
                    activate=bool(request_data.get("activate", True)),
                )
                engine = refresh_detection_engine()
                self._send_json({"ml": result})
            except Exception as exc:
                self._send_json(
                    {
                        "error": {
                            "message": "Model training failed.",
                            "type": "ml_training_error",
                            "details": {"technical_reason": str(exc)},
                        }
                    },
                    status=400,
                )
        elif self.path == "/v1/sandbox/decision":
            from pipeline.sandbox.session_tracker import get_tracker

            session_id = request_data.get("session_id", "")
            verdict = str(request_data.get("verdict", "MONITOR")).upper()
            note = request_data.get("note", "")
            session = get_tracker().submit_analyst_verdict(session_id, verdict, note)
            if not session:
                self._send_json({"error": "Sandbox session not found"}, status=404)
            else:
                self._send_json({"status": "recorded", "session_id": session_id, "verdict": verdict})
        elif self.path == "/ml/mode":
            try:
                status = model_manager.switch_mode(request_data.get("mode", "synthetic"))
                engine = refresh_detection_engine()
                self._send_json({"ml": status})
            except Exception as exc:
                self._send_json(
                    {
                        "error": {
                            "message": "Could not switch model mode.",
                            "type": "ml_mode_error",
                            "details": {"technical_reason": str(exc)},
                        }
                    },
                    status=400,
                )
        else:
            self._send_json({"error": "Endpoint not found"}, status=404)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _parse_limit(self, default: int = 50) -> int:
        path, _, query = self.path.partition("?")
        if not query:
            return default

        for part in query.split("&"):
            key, _, value = part.partition("=")
            if key == "limit":
                try:
                    return max(1, min(int(value), 500))
                except ValueError:
                    return default
        return default


def create_server(host: str = HOST, port: int = PORT) -> AetherSentrixThreadingHTTPServer:
    return AetherSentrixThreadingHTTPServer((host, port), AetherSentrixAPIHandler)


if __name__ == "__main__":
    server = create_server()
    print(f"AetherSentrix API running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down API server...")
        server.server_close()
