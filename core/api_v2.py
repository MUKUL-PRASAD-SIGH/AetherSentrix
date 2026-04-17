"""Production FastAPI application with security."""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime
from typing import Optional, List

from .api_models import (
    EventRequest, BatchEventRequest, DetectionResponse, AlertResponse,
    HealthResponse, AuthResponse, ErrorResponse, BatchDetectionResponse,
    ThreatSeverity, LoginRequest
)
from .detection_engine import DetectionEngine
from pipeline.config_prod import API_CONFIG, SECURITY_CONFIG, DETECTION_CONFIG
from pipeline.security.auth_manager import AuthManager, get_mock_user
from pipeline.security.rbac import Permission, check_permission
from pipeline.logging_enhanced import get_logger

logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=API_CONFIG['title'],
    version=API_CONFIG['version'],
    description=API_CONFIG['description']
)

# Add CORS middleware
if SECURITY_CONFIG['enable_cors']:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=SECURITY_CONFIG['cors_origins'],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Initialize security
auth_manager = AuthManager(
    secret_key=SECURITY_CONFIG['jwt_secret'],
    token_expiry_seconds=SECURITY_CONFIG['token_expiry_seconds']
)
security = HTTPBearer()

# Initialize detection engine
engine = DetectionEngine()

# In-memory storage for alerts (replace with database in production)
alerts_db = {}


# Dependency: Get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    """Extract and verify JWT token."""
    try:
        payload = auth_manager.verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        roles = payload.get("roles", [])
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "roles": roles}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


# Dependency: Check specific permission
def require_permission(permission: Permission):
    """Create dependency for permission checking."""
    async def check_perms(current_user: dict = Depends(get_current_user)):
        if not check_permission(permission, current_user["roles"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return check_perms


# ==================== Public Endpoints ====================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """API health and readiness check."""
    logger.info("Health check requested")
    return HealthResponse(
        status="healthy",
        version=API_CONFIG['version'],
        models_loaded={
            "anomaly_detector": "mock_v1.0",
            "threat_classifier": "mock_v1.0"
        }
    )


@app.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate and receive JWT token."""
    user = get_mock_user(request.username)
    
    if not user:
        logger.warning(f"Login attempt with invalid username: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Simple password check (use proper hashing in production)
    if request.password != "password":  # Default mock password
        logger.warning(f"Login attempt with wrong password for user: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_manager.create_token(user.user_id, user.roles)
    logger.info(f"User {user.username} logged in")
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in=SECURITY_CONFIG['token_expiry_seconds']
    )


# ==================== Detection Endpoints ====================

@app.post("/v1/detect/single", response_model=DetectionResponse)
async def detect_single_event(
    event: EventRequest,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Detect threat in single event."""
    try:
        logger.info(f"Detecting threat in event {event.event_id}")
        
        # Convert pydantic model to dict for the engine
        event_dict = event.dict()
        
        # Use the engine for detection
        result = engine.detect_events([event_dict])
        
        return DetectionResponse(
            event_id=event.event_id,
            anomaly_score=float(result.get("anomaly_score", 0.0)),
            is_anomaly=result.get("confidence") == "high" or result.get("anomaly_score", 0.0) > 0.7,
            predicted_threat=result.get("threat_category", "unknown"),
            threat_confidence=float(result.get("risk_score", 0.0) / 100.0),
            timestamp=event.timestamp
        )
    except Exception as e:
        logger.error(f"Detection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/v1/detect/batch", response_model=BatchDetectionResponse)
async def detect_batch(
    batch: BatchEventRequest,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Detect threats in batch of events."""
    try:
        batch_id = batch.batch_id or str(uuid.uuid4())
        logger.info(f"Processing batch {batch_id} with {len(batch.events)} events")
        
        # Convert list of pydantic models to list of dicts
        events_dicts = [[ev.dict()] for ev in batch.events]
        
        # Use the engine's batch capability (parallel processing)
        batch_results = engine.detect_events_batch(events_dicts)
        
        results = []
        anomaly_count = 0
        
        for idx, res in enumerate(batch_results):
            is_anomaly = res.get("confidence") == "high" or res.get("anomaly_score", 0.0) > 0.7
            results.append(DetectionResponse(
                event_id=batch.events[idx].event_id,
                anomaly_score=float(res.get("anomaly_score", 0.0)),
                is_anomaly=is_anomaly,
                predicted_threat=res.get("threat_category", "unknown"),
                threat_confidence=float(res.get("risk_score", 0.0) / 100.0),
                timestamp=batch.events[idx].timestamp
            ))
            if is_anomaly:
                anomaly_count += 1
        
        return BatchDetectionResponse(
            batch_id=batch_id,
            results=results,
            total_events=len(batch.events),
            anomalies_detected=anomaly_count
        )
    except Exception as e:
        logger.error(f"Batch detection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Alert Management ====================

@app.get("/v1/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Retrieve specific alert."""
    if alert_id not in alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alerts_db[alert_id]


@app.get("/v1/alerts", response_model=List[AlertResponse])
async def list_alerts(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[ThreatSeverity] = None,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Query alerts with filtering."""
    alerts = list(alerts_db.values())
    
    # Filter by severity if specified
    if severity:
        alerts = [a for a in alerts if a.severity == severity]
    
    # Pagination
    return alerts[skip:skip + limit]


@app.put("/v1/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.MANAGE_ALERTS))
):
    """Update alert status."""
    status = request_body.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Missing status")

    if alert_id not in alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alerts_db[alert_id].status = status
    logger.info(f"Alert {alert_id} status updated to {status} by {current_user['user_id']}")
    
    return {"alert_id": alert_id, "status": status}


# ==================== Model Management ====================

@app.get("/v1/models/active")
async def get_active_models(
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """List currently active model versions."""
    return {
        "anomaly_detector": "mock_v1.0",
        "threat_classifier": "mock_v1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/v1/models/switch")
async def switch_model(
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.MODEL_MANAGEMENT))
):
    """Switch active model version (admin only)."""
    model_name = request_body.get("model_name", "")
    version = request_body.get("version", "")
    if not model_name or not version:
        raise HTTPException(status_code=400, detail="Missing model_name or version")

    logger.warning(f"Model switch requested for {model_name} to {version} by {current_user['user_id']}")
    return {"status": "success", "model": model_name, "version": version}


# ==================== Adaptive Trust & Deception Sandbox ====================

@app.post("/v1/trust/evaluate")
async def evaluate_trust(
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """
    Evaluate trust score for a session using all four trust layers.
    Body: { session_id, source_ip, user_id, transfer_mb, requests_per_min,
            endpoints_accessed, hour_of_day, event_timestamps }
    """
    try:
        from pipeline.trust.context_scorer import ContextScorer, SessionContext
        from pipeline.trust.behavioral_scorer import BehaviouralScorer, BehaviourObservation
        from pipeline.trust.spike_scorer import SpikeScorer, SpikeObservation, TimestampedEvent
        from pipeline.trust.intent_signals import IntentSignalDetector, IntentObservation, RequestLog
        from pipeline.trust.trust_engine import TrustEngine, TrustInput
        from pipeline.trust.decision_engine import DecisionEngine

        session_id = request_body.get("session_id", str(uuid.uuid4()))

        ctx = SessionContext(
            user_id=request_body.get("user_id"),
            source_ip=request_body.get("source_ip", "0.0.0.0"),
            device_fingerprint=request_body.get("device_fingerprint"),
            country_code=request_body.get("country_code"),
            is_first_time_ip=request_body.get("is_first_time_ip", False),
            previous_login_count=request_body.get("previous_login_count", 5),
        )

        beh = BehaviourObservation(
            user_id=request_body.get("user_id"),
            transfer_mb=float(request_body.get("transfer_mb", 0)),
            requests_per_min=float(request_body.get("requests_per_min", 0)),
            endpoints_accessed=request_body.get("endpoints_accessed", []),
            hour_of_day=int(request_body.get("hour_of_day", 12)),
        )

        raw_ts = request_body.get("event_timestamps", [])
        spike_obs = SpikeObservation(
            events=[TimestampedEvent(timestamp=t) for t in raw_ts]
        )

        raw_logs = request_body.get("request_logs", [])
        intent_obs = IntentObservation(
            request_logs=[
                RequestLog(
                    path=r.get("path", "/"),
                    method=r.get("method", "GET"),
                    status_code=int(r.get("status_code", 200)),
                    payload_snippet=r.get("payload_snippet", ""),
                )
                for r in raw_logs
            ],
            session_failure_count=int(request_body.get("session_failure_count", 0)),
            session_success_after_failures=request_body.get("session_success_after_failures", False),
        )

        engine_trust = TrustEngine()
        result = engine_trust.evaluate(
            session_id=session_id,
            inputs=TrustInput(context=ctx, behaviour=beh, spikes=spike_obs, intent=intent_obs),
        )

        decision = DecisionEngine().decide(result)

        logger.info(
            f"Trust eval for session {session_id}: score={result.trust_score} "
            f"label={result.label} verdict={decision.verdict}"
        )

        return {
            "trust_result": result.to_dict(),
            "decision": decision.to_dict(),
        }

    except Exception as e:
        logger.error(f"Trust evaluation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/v1/sandbox/sessions")
async def list_sandbox_sessions(
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """List all sandboxed sessions (active and resolved)."""
    from pipeline.sandbox.session_tracker import get_tracker
    tracker = get_tracker()
    return {"sessions": tracker.all_as_dicts(), "total": len(tracker.list_all())}


@app.get("/v1/sandbox/sessions/{session_id}")
async def get_sandbox_session(
    session_id: str,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Get detailed view of a single sandbox session."""
    from pipeline.sandbox.session_tracker import get_tracker
    from pipeline.sandbox.intent_classifier import IntentClassifier
    from pipeline.explainability import ExplainabilityEngine

    session = get_tracker().get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sandbox session not found")

    intent = IntentClassifier().classify(session)
    explanation = ExplainabilityEngine().explain_sandbox_decision(
        trust_result={"trust_score": session.current_trust_score,
                      "label": intent.label.value, "risk_flags": []},
        sandbox_session=session.to_dict(),
        intent_classification=intent.to_dict(),
    )

    return {
        "session": session.to_dict(),
        "intent_classification": intent.to_dict(),
        "explanation": explanation,
    }


@app.post("/v1/sandbox/decision")
async def submit_sandbox_decision(
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.MANAGE_ALERTS))
):
    """
    SOC analyst submits a verdict for a sandboxed session.
    Body: { session_id, verdict: ALLOW|BLOCK|MONITOR, note }
    """
    from pipeline.sandbox.session_tracker import get_tracker

    session_id = request_body.get("session_id", "")
    verdict = request_body.get("verdict", "MONITOR").upper()
    note = request_body.get("note", "")

    session = get_tracker().submit_analyst_verdict(session_id, verdict, note)
    if not session:
        raise HTTPException(status_code=404, detail="Sandbox session not found")

    logger.info(
        f"Analyst {current_user['user_id']} submitted verdict={verdict} "
        f"for sandbox session {session_id}"
    )
    return {"status": "recorded", "session_id": session_id, "verdict": verdict}


# ==================== Ambiguous Session (Edge-Case) Endpoints ====================

@app.post("/v1/sandbox/ambiguous/create")
async def create_ambiguous_session(
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """
    Register a new ambiguous session — both users sandboxed on identical trigger.
    Body: { user_id, source_ip, trigger_reason }
    """
    from pipeline.sandbox.ambiguous_session_handler import get_ambiguous_registry
    reg = get_ambiguous_registry()
    session = reg.create_session(
        user_id=request_body.get("user_id"),
        source_ip=request_body.get("source_ip", "0.0.0.0"),
        trigger_reason=request_body.get("trigger_reason", "unknown"),
    )
    logger.info(f"Ambiguous session created: {session.session_id} user={session.user_id}")
    return session.to_dict()


@app.post("/v1/sandbox/ambiguous/{session_id}/event")
async def record_ambiguous_event(
    session_id: str,
    request_body: dict,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """
    Record a post-auth event for an ambiguous session.
    Body: { action_type, endpoint, payload_snippet, status_code, is_suspicious }
    Triggers automatic divergence re-scoring after each event.
    """
    from pipeline.sandbox.ambiguous_session_handler import get_ambiguous_registry, PostAuthEvent
    import time as _time

    event = PostAuthEvent(
        timestamp=_time.time(),
        action_type=request_body.get("action_type", "normal_read"),
        endpoint=request_body.get("endpoint", "/"),
        payload_snippet=request_body.get("payload_snippet", ""),
        status_code=int(request_body.get("status_code", 200)),
        is_suspicious=bool(request_body.get("is_suspicious", False)),
    )

    session = get_ambiguous_registry().record_event(session_id, event)
    if not session:
        raise HTTPException(status_code=404, detail="Ambiguous session not found")

    logger.info(
        f"Ambiguous event recorded for {session_id}: "
        f"action={event.action_type} label={session.label} score={session.divergence_score:.2f}"
    )
    return {
        "session": session.to_dict(),
        "auto_resolved": session.resolved,
        "summary": session.summary(),
    }


@app.get("/v1/sandbox/ambiguous")
async def list_ambiguous_sessions(
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """List all ambiguous sessions with their current divergence labels."""
    from pipeline.sandbox.ambiguous_session_handler import get_ambiguous_registry
    sessions = get_ambiguous_registry().list_all()
    return {
        "sessions": [s.to_dict() for s in sessions],
        "total": len(sessions),
        "unresolved": sum(1 for s in sessions if not s.resolved),
    }


@app.get("/v1/sandbox/ambiguous/{session_id}")
async def get_ambiguous_session(
    session_id: str,
    current_user: dict = Depends(require_permission(Permission.READ_ALERTS))
):
    """Get full detail of one ambiguous session including divergence score and event log."""
    from pipeline.sandbox.ambiguous_session_handler import get_ambiguous_registry
    session = get_ambiguous_registry().get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Ambiguous session not found")
    return {
        "session": session.to_dict(),
        "summary": session.summary(),
        "events": [
            {
                "timestamp": e.timestamp,
                "action_type": e.action_type,
                "endpoint": e.endpoint,
                "is_suspicious": e.is_suspicious,
            }
            for e in session.post_auth_events
        ],
    }


# ==================== Error Handlers ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AetherSentrix API server")
    uvicorn.run(
        app,
        host=API_CONFIG['host'],
        port=API_CONFIG['port']
    )
