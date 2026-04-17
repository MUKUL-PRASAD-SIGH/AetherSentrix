"""Production FastAPI application with security."""

from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthCredential
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
from datetime import datetime
from typing import Optional, List

from api_models import (
    EventRequest, BatchEventRequest, DetectionResponse, AlertResponse,
    HealthResponse, AuthResponse, ErrorResponse, BatchDetectionResponse,
    ThreatSeverity, LoginRequest
)
from pipeline.config_prod import API_CONFIG, SECURITY_CONFIG, DETECTION_CONFIG
from pipeline.mlops.base_model import MockAnomalyDetector, MockThreatClassifier
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

# Initialize mock models
anomaly_detector = MockAnomalyDetector()
threat_classifier = MockThreatClassifier()

# In-memory storage for alerts (replace with database in production)
alerts_db = {}


# Dependency: Get current user from token
async def get_current_user(credentials: HTTPAuthCredential = Depends(security)):
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
        if not check_permission(current_user["roles"], permission):
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
        
        # Create feature vector (mock)
        import numpy as np
        features = np.array([[
            event.payload_bytes, event.duration_sec, event.port, 1, 0, 0, 0, 0, 0, 0
        ]])
        
        # Anomaly detection
        anomaly_result = anomaly_detector.detect(features)
        
        # Threat classification
        threat_result = threat_classifier.classify(features)
        
        return DetectionResponse(
            event_id=event.event_id,
            anomaly_score=float(anomaly_result['anomaly_score'][0]),
            is_anomaly=bool(anomaly_result['is_anomaly'][0]),
            predicted_threat=threat_result['threat_class'][0],
            threat_confidence=float(threat_result['confidence'][0]),
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
        
        results = []
        anomaly_count = 0
        
        for event in batch.events:
            result = await detect_single_event(event, current_user)
            results.append(result)
            if result.is_anomaly:
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
    status: str,
    current_user: dict = Depends(require_permission(Permission.MANAGE_ALERTS))
):
    """Update alert status."""
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
    model_name: str,
    version: str,
    current_user: dict = Depends(require_permission(Permission.MODEL_MANAGEMENT))
):
    """Switch active model version (admin only)."""
    logger.warning(f"Model switch requested for {model_name} to {version} by {current_user['user_id']}")
    
    # In production, load actual model from registry
    return {"status": "success", "model": model_name, "version": version}


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
