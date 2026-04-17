"""Role-Based Access Control (RBAC) definitions."""

from enum import Enum
from typing import Dict, List, Set


class Role(str, Enum):
    """User roles."""
    ADMIN = "admin"
    ANALYST = "analyst"
    READ_ONLY = "read_only"
    INTEGRATOR = "integrator"


class Permission(str, Enum):
    """System permissions."""
    READ_ALERTS = "read_alerts"
    MANAGE_ALERTS = "manage_alerts"
    MODEL_MANAGEMENT = "model_management"
    CONFIG_MANAGEMENT = "config_management"
    AUDIT_LOG = "audit_log"
    USER_MANAGEMENT = "user_management"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.ADMIN: {
        Permission.READ_ALERTS,
        Permission.MANAGE_ALERTS,
        Permission.MODEL_MANAGEMENT,
        Permission.CONFIG_MANAGEMENT,
        Permission.AUDIT_LOG,
        Permission.USER_MANAGEMENT
    },
    Role.ANALYST: {
        Permission.READ_ALERTS,
        Permission.MANAGE_ALERTS,
        Permission.AUDIT_LOG
    },
    Role.READ_ONLY: {
        Permission.READ_ALERTS
    },
    Role.INTEGRATOR: {
        Permission.READ_ALERTS,
        Permission.MANAGE_ALERTS
    }
}


def get_user_permissions(roles: List[str]) -> Set[Permission]:
    """Get all permissions for a list of roles."""
    permissions = set()
    for role_str in roles:
        try:
            role = Role(role_str)
            permissions.update(ROLE_PERMISSIONS.get(role, set()))
        except ValueError:
            # Invalid role, skip
            pass
    return permissions


def has_permission(roles: List[str], required_permission: Permission) -> bool:
    """Check if user with given roles has required permission."""
    permissions = get_user_permissions(roles)
    return required_permission in permissions


def check_permission(required_permission: Permission, user_roles: List[str]) -> bool:
    """Check if user can perform action."""
    return has_permission(user_roles, required_permission)
