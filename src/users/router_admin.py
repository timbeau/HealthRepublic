# src/users/router_admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth.deps import require_roles
from .models import User

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(require_roles("admin"))],
)

# ---------- GET ALL USERS ----------
@router.get("/")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "user_type": u.user_type,
            "state": u.state,
            "active": True,  # until you add deactivation flag
        }
        for u in users
    ]

# ---------- GET ONE USER ----------
@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

# ---------- DEACTIVATE USER ----------
@router.delete("/{user_id}")
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Soft delete (recommended)
    user.role = "inactive"

    db.commit()
    return {"message": "User deactivated"}
