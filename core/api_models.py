"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class EventRequest(BaseModel):
    """Single security event for analysis."""
    event_id: str
    timestamp: int
    source_ip: str = Field(..., description="Source IP address")
    dest_ip: str = Field(..., description="Destination IP address")
    protocol: str = Field(..., description="Protocol (TCP, UDP, ICMP)")
    port: int = Field(..., ge=1, le=65535)
    payload_bytes: int = Field(..., ge=0)
    duration_sec: float = Field(..., ge=0)
    metadata: Optional[Dict[str, Any]] = {}

    @validator('protocol')
    def validate_protocol(cls, v):
        valid_protocols = ['TCP', 'UDP', 'ICMP']
        if v.upper() not in valid_protocols:
            raise ValueError(f'Protocol must be one of {valid_protocols}')
        return v.upper()

    class Config:
        schema_extra = {
            "example": {
                "event_id": "evt_12345",
                "timestamp": 1713283200,
                "source_ip": "192.168.1.100",
                "dest_ip": "10.0.0.1",
                "protocol": "TCP",
                "port": 443,
                "payload_bytes": 1024,
                "duration_sec": 2.5,
                "metadata": {}
            }
        }


class BatchEventRequest(BaseModel):
    """Batch of events for processing."""
    events: List[EventRequest]
    batch_id: Optional[str] = None


class ThreatSeverity(str, Enum):
    """Alert severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class DetectionResponse(BaseModel):
    """Detection result response."""
    event_id: str
    anomaly_score: float = Field(..., ge=0, le=1)
    is_anomaly: bool
    predicted_threat: str
    threat_confidence: float = Field(..., ge=0, le=1)
    timestamp: int


class AlertResponse(BaseModel):
    """Alert response model."""
    alert_id: str
    event_id: str
    threat_type: str
    severity: ThreatSeverity
    anomaly_score: float
    confidence: float
    timestamp: int
    source_ip: str
    dest_ip: str
    description: str
    mitre_tactics: List[str] = []
    recommended_actions: List[str] = []
    status: str = "new"


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    models_loaded: Dict[str, str]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ModelInfoResponse(BaseModel):
    """Model information response."""
    model_name: str
    version: str
    algorithm: str
    created_at: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None


class AuthRequest(BaseModel):
    """Authentication request."""
    username: str
    password: str


class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class WebhookConfig(BaseModel):
    """Webhook configuration."""
    webhook_id: str
    target_url: str
    event_types: List[str]
    auth_token: Optional[str] = None
    active: bool = True


class ErrorResponse(BaseModel):
    """Error response model."""
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class BatchDetectionResponse(BaseModel):
    """Batch detection response."""
    batch_id: Optional[str] = None
    results: List[DetectionResponse]
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    total_events: int
    anomalies_detected: int


class UserResponse(BaseModel):
    """User information response."""
    user_id: str
    username: str
    roles: List[str]


class LoginRequest(BaseModel):
    """Login request."""
    username: str
    password: str


class TokenRefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


class AlertQueryResponse(BaseModel):
    """Alert query response."""
    total: int
    alerts: List[AlertResponse]
    page: int = 1
    page_size: int = 100


class WhatIfRequest(BaseModel):
    """Counterfactual security control analysis request."""
    scenario: Optional[str] = None
    baseline_attack: Optional[str] = None
    modifications: List[str] = Field(default_factory=list)
    measure: str = "success_probability"
    target_environment: Optional[str] = None


class WhatIfResponse(BaseModel):
    """Counterfactual analysis response."""
    what_if: Dict[str, Any]
