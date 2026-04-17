"""Authentication and JWT token management."""

import jwt
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AuthManager:
    """Manage JWT-based authentication."""

    def __init__(self, secret_key: str, algorithm: str = "HS256", token_expiry_seconds: int = 3600):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_expiry = token_expiry_seconds

    def create_token(self, user_id: str, roles: List[str], extra_claims: Dict = None) -> str:
        """Generate JWT token."""
        payload = {
            'user_id': user_id,
            'roles': roles,
            'exp': datetime.utcnow() + timedelta(seconds=self.token_expiry),
            'iat': datetime.utcnow()
        }
        
        if extra_claims:
            payload.update(extra_claims)
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.info(f"Created token for user {user_id}")
        return token

    def verify_token(self, token: str) -> Dict:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise ValueError("Invalid token")

    def refresh_token(self, token: str) -> str:
        """Refresh an existing token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_exp": False})
            # Remove old expiry
            payload.pop('exp', None)
            payload.pop('iat', None)
            
            # Create new token
            return self.create_token(payload['user_id'], payload['roles'])
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise ValueError("Token refresh failed")


class User:
    """Simple user model."""
    
    def __init__(self, user_id: str, username: str, roles: List[str]):
        self.user_id = user_id
        self.username = username
        self.roles = roles
    
    def has_role(self, role: str) -> bool:
        """Check if user has specific role."""
        return role in self.roles
    
    def has_permission(self, permission: str, role_permissions: Dict) -> bool:
        """Check if user has permission."""
        for role in self.roles:
            if role in role_permissions:
                if permission in role_permissions[role]:
                    return True
        return False


# Mock user database
MOCK_USERS: Dict[str, User] = {
    "admin_user": User("admin_user", "admin", ["admin"]),
    "analyst_user": User("analyst_user", "analyst", ["analyst"]),
    "read_only_user": User("read_only_user", "reader", ["read_only"]),
    "integrator_user": User("integrator_user", "integrator", ["integrator"])
}


def get_mock_user(username: str) -> Optional[User]:
    """Get mock user by username."""
    for user in MOCK_USERS.values():
        if user.username == username:
            return user
    return None
