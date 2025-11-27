# src/auth/deps.py

from typing import Optional, Set

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .security import oauth2_scheme
from .utils import decode_access_token
from ..database import get_db
from ..users.models import User


# ----------------------------------------------------------------------------
# Core helpers
# ----------------------------------------------------------------------------

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT access token and return the associated User.

    Uses auth.utils.decode_access_token(), which already knows how to:
      - Verify signature & expiry using settings.SECRET_KEY and HS256.
      - Raise ValueError on invalid/expired tokens.

    Expects:
      - payload["sub"] = user id (as string).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except ValueError:
        # Invalid or expired
        raise credentials_exception

    subject = payload.get("sub")
    if subject is None:
        raise credentials_exception

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        # sub is not an int – token doesn't match expected format
        raise credentials_exception

    user = get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception

    return user


# ----------------------------------------------------------------------------
# Role-based access helpers
# ----------------------------------------------------------------------------

def _normalize_roles(roles: Optional[Set[str]]) -> Set[str]:
    if not roles:
        return set()
    return {r.lower() for r in roles}


def require_roles(*allowed_roles: str):
    """
    Dependency factory that ensures the current user has one of the allowed roles.
    Comparison is case-insensitive.

    Usage:

        @router.get("/admin-only")
        def admin_only(
            current_admin: User = Depends(require_roles("admin")),
        ):
            ...

        @router.get("/member-or-admin")
        def member_or_admin(
            current_user: User = Depends(require_roles("member", "admin")),
        ):
            ...
    """
    allowed_normalized = _normalize_roles(set(allowed_roles))

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").lower()
        if user_role not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency
