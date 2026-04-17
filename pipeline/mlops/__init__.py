from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model_manager import ModelManager


def get_model_manager():
    from .model_manager import get_model_manager as _get_model_manager

    return _get_model_manager()


__all__ = ["get_model_manager", "ModelManager"]
