# src/users/schemas.py

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, constr
from pydantic.config import ConfigDict

from .enums import RoleEnum, UserTypeEnum


# ---------- Base models ----------

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    state: Optional[str] = Field(default=None, max_length=2)
    age_range: Optional[str] = None
    industry: Optional[str] = None
    household_size: Optional[int] = None

    role: RoleEnum = RoleEnum.member
    user_type: UserTypeEnum = UserTypeEnum.consumer


class UserCreate(UserBase):
    """
    Used for public registration.

    NOTE:
    - We *accept* role/user_type in the payload for convenience,
      but the public /users/register endpoint will **override** them
      to RoleEnum.member and UserTypeEnum.consumer.
    """

    password: constr(min_length=8, max_length=128)  # type: ignore[valid-type]


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    state: Optional[str] = None
    age_range: Optional[str] = None
    industry: Optional[str] = None
    household_size: Optional[int] = None

    role: RoleEnum
    user_type: UserTypeEnum

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------- Lookups ----------

class LookupsResponse(BaseModel):
    age_ranges: List[str]
    industries: List[str]
    roles: List[str]
    user_types: List[str]
