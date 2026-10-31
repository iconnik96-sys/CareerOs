import contextvars
from typing import Optional

_current_user_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_user_id", default=None)
_current_request_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_request_id", default=None)


def set_current_user_id(user_id: Optional[str]) -> None:
    """Stores the authenticated user ID in the current asynchronous task context."""
    _current_user_id.set(str(user_id) if user_id else None)


def get_current_user_id() -> Optional[str]:
    """Retrieves the authenticated user ID from the current context."""
    return _current_user_id.get()


def set_current_request_id(request_id: Optional[str]) -> None:
    """Stores the request trace ID in the current context."""
    _current_request_id.set(str(request_id) if request_id else None)


def get_current_request_id() -> Optional[str]:
    """Retrieves the request trace ID from the current context."""
    return _current_request_id.get()

