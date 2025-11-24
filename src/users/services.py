from sqlalchemy.orm import Session
from .models import User
from ..auth.utils import hash_password  # Import from auth module

def create_user(db: Session, user_data: dict):
    """Create a new user with hashed password."""
    hashed_pw = hash_password(user_data["password"])
    new_user = User(email=user_data["email"], profession=user_data["profession"], is_company=user_data.get("is_company", False))
    # Set hashed password (assume a password field in model)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
