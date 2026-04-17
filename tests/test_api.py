"""API endpoint tests."""

import pytest


@pytest.mark.unit
class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self, client):
        """Health check returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "models_loaded" in data


@pytest.mark.unit
class TestAuthenticationEndpoint:
    """Test authentication endpoints."""

    def test_login_valid_credentials(self, client):
        """Login with valid credentials returns token."""
        response = client.post("/login", json={
            "username": "analyst",
            "password": "password"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        """Login with invalid credentials returns 401."""
        response = client.post("/login", json={
            "username": "invalid",
            "password": "wrong"
        })
        assert response.status_code == 401

    def test_login_wrong_password(self, client):
        """Login with wrong password returns 401."""
        response = client.post("/login", json={
            "username": "analyst",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.mark.integration
class TestDetectionEndpoints:
    """Test detection endpoints."""

    def test_single_event_detection_without_auth(self, client, sample_event):
        """Detection requires authentication."""
        response = client.post("/v1/detect/single", json=sample_event)
        assert response.status_code == 403  # Forbidden without auth

    def test_single_event_detection_with_auth(self, client, sample_event, valid_token):
        """Detection with valid token succeeds."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.post("/v1/detect/single", json=sample_event, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["event_id"] == sample_event["event_id"]
        assert "anomaly_score" in data
        assert "predicted_threat" in data
        assert "threat_confidence" in data

    def test_batch_detection(self, client, sample_event, valid_token):
        """Batch detection processes multiple events."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        batch = {
            "batch_id": "batch_001",
            "events": [sample_event, sample_event]
        }
        response = client.post("/v1/detect/batch", json=batch, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["batch_id"] == "batch_001"
        assert len(data["results"]) == 2

    def test_invalid_protocol(self, client, valid_token):
        """Invalid protocol returns validation error."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        event = {
            "event_id": "test",
            "timestamp": 1713283200,
            "source_ip": "192.168.1.1",
            "dest_ip": "10.0.0.1",
            "protocol": "INVALID",
            "port": 443,
            "payload_bytes": 1024,
            "duration_sec": 2.5
        }
        response = client.post("/v1/detect/single", json=event, headers=headers)
        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestAlertEndpoints:
    """Test alert management endpoints."""

    def test_list_alerts_empty(self, client, valid_token):
        """List alerts when none exist."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/v1/alerts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_nonexistent_alert(self, client, valid_token):
        """Get nonexistent alert returns 404."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/v1/alerts/nonexistent", headers=headers)
        assert response.status_code == 404

    def test_update_alert_status_requires_permission(self, client, valid_token):
        """Update alert status requires MANAGE_ALERTS permission."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        
        # Analyst has manage_alerts, so this should work
        response = client.put(
            "/v1/alerts/test_alert/status",
            json={"status": "investigating"},
            headers=headers
        )
        # Will fail because alert doesn't exist, but would succeed with permission
        assert response.status_code in [404, 200]


@pytest.mark.unit
class TestModelManagement:
    """Test model management endpoints."""

    def test_get_active_models(self, client, valid_token):
        """Get active models returns model info."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/v1/models/active", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "anomaly_detector" in data
        assert "threat_classifier" in data

    def test_switch_model_requires_admin(self, client, valid_token):
        """Switch model requires admin permission."""
        # valid_token is for 'analyst' which doesn't have model management
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.post(
            "/v1/models/switch",
            json={"model_name": "anomaly_detector", "version": "v1.1"},
            headers=headers
        )
        assert response.status_code == 403  # Forbidden


@pytest.mark.security
class TestAuthenticationSecurity:
    """Test authentication security."""

    def test_invalid_token_format(self, client):
        """Invalid token format returns 401."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/v1/alerts", headers=headers)
        assert response.status_code == 401

    def test_missing_authorization_header(self, client):
        """Missing auth header returns 403."""
        response = client.get("/v1/alerts")
        assert response.status_code == 403

    def test_expired_token(self, client):
        """Expired token should be rejected."""
        # Create a token with very short expiry and wait
        import time
        import jwt
        from pipeline.security.auth_manager import AuthManager
        from pipeline.config_prod import SECURITY_CONFIG
        
        auth = AuthManager(
            SECURITY_CONFIG['jwt_secret'],
            token_expiry_seconds=1
        )
        token = auth.create_token("test_user", ["analyst"])
        time.sleep(2)
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/v1/alerts", headers=headers)
        assert response.status_code == 401
