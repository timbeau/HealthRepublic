# src/users/router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from . import schemas
from .enums import AgeRangeEnum, IndustryEnum, RoleEnum, UserTypeEnum
from . import models                      # for models.User
from . import models as user_models       # existing alias used elsewhere
from ..auth.utils import hash_password
from ..auth.deps import require_roles

router = APIRouter(prefix="/users", tags=["users"])


# ---------- Public lookups: used by registration form ----------

@router.get("/lookups", response_model=schemas.LookupsResponse)
def get_lookups():
    """
    Returns all lookup values for user registration.
    Public endpoint (no auth).

    Admin role is deliberately *excluded* from the roles list
    for self-service signup.
    """
    return schemas.LookupsResponse(
        age_ranges=[a.value for a in AgeRangeEnum],
        industries=[i.value for i in IndustryEnum],
        roles=[r.value for r in RoleEnum if r != RoleEnum.admin],
        user_types=[u.value for u in UserTypeEnum],
    )


# ---------- Public registration (locked to member/consumer) ----------

@router.post(
    "/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Public registration endpoint.

    - Always creates users with:
        role = member
        user_type = consumer

    - Even if the client sends other values, they are ignored here.
    """
    existing = (
        db.query(user_models.User)
        .filter(user_models.User.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    hashed = hash_password(payload.password)

    user = user_models.User(
        email=payload.email,
        hashed_password=hashed,
        full_name=payload.full_name,
        state=payload.state,
        age_range=payload.age_range,
        industry=payload.industry,
        household_size=payload.household_size,
        role=RoleEnum.member.value,
        user_type=UserTypeEnum.consumer.value,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ---------- Public registration: supplier / provider / insurer (no admin) ----------

@router.post(
    "/register-supplier",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register_supplier(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Public registration for suppliers / providers / insurers.

    - Forces role = supplier
    - Never allows admin
    - Uses whatever valid user_type the client sends (as defined in UserTypeEnum),
      or falls back to a default enum value if missing.
    """

    # Ensure email unique
    existing = (
        db.query(models.User)
        .filter(models.User.email == user_in.email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Force supplier role (use .value so we store the same kind of string
    # as in register_user).
    role_value = RoleEnum.supplier.value

    # user_type has already been validated against UserTypeEnum by Pydantic.
    # If the client did not send one, or sent something invalid, we fall back.
    if isinstance(user_in.user_type, UserTypeEnum):
        user_type_value = user_in.user_type.value
    else:
        # Fallback: first enum value (you can change this to a specific one
        # once you decide which user_type best fits suppliers by default).
        user_type_value = list(UserTypeEnum)[0].value

    db_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        state=user_in.state,
        age_range=user_in.age_range,
        industry=user_in.industry,
        household_size=user_in.household_size,
        role=role_value,
        user_type=user_type_value,
        hashed_password=hash_password(user_in.password),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# ---------- Admin-only create user (can set role/admin) ----------

@router.post(
    "/admin/create",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles("admin")),
):
    """
    Admin-only endpoint for creating users with any role/user_type,
    including admin.
    """

    existing = (
        db.query(user_models.User)
        .filter(user_models.User.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    hashed = hash_password(payload.password)

    user = user_models.User(
        email=payload.email,
        hashed_password=hashed,
        full_name=payload.full_name,
        state=payload.state,
        age_range=payload.age_range,
        industry=payload.industry,
        household_size=payload.household_size,
        role=payload.role.value
        if isinstance(payload.role, RoleEnum)
        else payload.role,
        user_type=(
            payload.user_type.value
            if isinstance(payload.user_type, UserTypeEnum)
            else payload.user_type
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
