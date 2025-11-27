# src/auth/router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..users import models as user_models
from ..users.schemas import UserOut
from . import schemas
from .utils import (
    create_access_token,
    create_refresh_token,
    verify_password,
    decode_access_token,
)
from .deps import get_current_user

# NOTE: no prefix here; main.py already does prefix="/auth"
router = APIRouter()


@router.post("/login", response_model=schemas.TokenPair)
def login_for_tokens(
    credentials: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Exchange email+password for an access token and refresh token.
    """
    user = (
        db.query(user_models.User)
        .filter(user_models.User.email == credentials.email)
        .first()
    )

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Claims embedded in the token
    claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "user_type": user.user_type,
    }

    access_token = create_access_token(claims)
    refresh_token = create_refresh_token(claims)

    return schemas.TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=schemas.TokenRefreshResponse)
def refresh_tokens(body: schemas.TokenRefreshRequest):
    """
    Exchange a refresh token for a new access + refresh pair.
    """
    try:
        payload = decode_access_token(body.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not a refresh token",
        )

    claims = {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "user_type": payload.get("user_type"),
    }

    new_access = create_access_token(claims)
    new_refresh = create_refresh_token(claims)

    return schemas.TokenRefreshResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
    )


@router.get("/me", response_model=UserOut)
def read_current_user(
    current_user: user_models.User = Depends(get_current_user),
):
    """
    Return the currently authenticated user (based on Bearer token).
    """
    return current_user
