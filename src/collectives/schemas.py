# src/collectives/schemas.py
from typing import Optional

from pydantic import BaseModel


class CollectiveBase(BaseModel):
    name: str
    slug: str
    description: str
    target_industry: Optional[str] = None
    target_state: Optional[str] = None
    target_age_range: Optional[str] = None
    min_household_size: Optional[int] = None
    max_household_size: Optional[int] = None


class CollectiveCreate(CollectiveBase):
    pass


class CollectiveOut(CollectiveBase):
    id: int

    model_config = {"from_attributes": True}


class CollectiveWithStats(CollectiveOut):
    member_count: int


class CollectiveRecommendation(BaseModel):
    collective: CollectiveOut
    score: int

    model_config = {"from_attributes": True}


class CollectiveMembershipOut(BaseModel):
    id: int
    user_id: int
    collective_id: int

    model_config = {"from_attributes": True}
