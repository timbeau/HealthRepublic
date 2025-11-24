# src/auth/utils.py

from datetime import datetime, timedelta
from typing import Any, Dict, Union

from jose import jwt, JWTError
from passlib.context import CryptContext

from ..config import settings

# ---------------------------------------------------------------------------
# Password hashing (PBKDF2 only – NO bcrypt)
# ---------------------------------------------------------------------------

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using PBKDF2-SHA256.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a PBKDF2-SHA256 hash.
    Returns False if the hash format is unknown or invalid.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"


def _create_token_from_claims(
    claims: Dict[str, Any],
    expires_delta: timedelta,
    token_type: str,
) -> str:
    to_encode = claims.copy()
    now = datetime.utcnow()
    to_encode["iat"] = int(now.timestamp())
    to_encode["exp"] = int((now + expires_delta).timestamp())
    to_encode["type"] = token_type

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(
    claims_or_user_id: Union[Dict[str, Any], int],
    role: str | None = None,
    user_type: str | None = None,
    extra_claims: Dict[str, Any] | None = None,
) -> str:
    """
    Backwards-compatible helper:

    - OLD style: create_access_token({"sub": "1", "email": "...", "role": "...", ...})
    - NEW style: create_access_token(user_id=1, role="member", user_type="individual")

    This function supports both.
    """
    if isinstance(claims_or_user_id, dict) and role is None and user_type is None:
        # Old-style: caller passed a claims dict
        base_claims = claims_or_user_id.copy()
    else:
        # New-style: caller passed user_id, role, user_type
        user_id = int(claims_or_user_id)
        base_claims = {
            "sub": str(user_id),
            "role": role,
            "user_type": user_type,
        }
        if extra_claims:
            base_claims.update(extra_claims)

    return _create_token_from_claims(
        base_claims,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )


def create_refresh_token(
    claims_or_user_id: Union[Dict[str, Any], int],
    role: str | None = None,
    user_type: str | None = None,
    extra_claims: Dict[str, Any] | None = None,
) -> str:
    """
    Same dual API as create_access_token, but for refresh tokens.
    """
    if isinstance(claims_or_user_id, dict) and role is None and user_type is None:
        base_claims = claims_or_user_id.copy()
    else:
        user_id = int(claims_or_user_id)
        base_claims = {
            "sub": str(user_id),
            "role": role,
            "user_type": user_type,
        }
        if extra_claims:
            base_claims.update(extra_claims)

    return _create_token_from_claims(
        base_claims,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode & validate a JWT (access OR refresh).
    Raises ValueError on failure.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e
