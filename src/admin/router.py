# src/admin/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_roles
from ..database import get_db
from ..users.models import User
from ..users.schemas import UserOut
from ..auth.utils import hash_password

router = APIRouter()


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles("admin"))
):
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserOut)
def create_user_admin(
    payload: dict,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles("admin"))
):
    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "member")
    full_name = payload.get("full_name")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        user_type="individual",
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "inactive"
    db.commit()
    return {"success": True}


@router.post("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "member"
    db.commit()
    return {"success": True"}
