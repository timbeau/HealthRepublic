# src/dashboard/schemas.py

from typing import List, Optional, Union, Literal
from pydantic import BaseModel


# Shared little “summary card” type you can reuse
class StatCard(BaseModel):
    label: str
    value: float
    unit: Optional[str] = None
    trend: Optional[str] = None  # e.g. "up", "down", "flat"
    hint: Optional[str] = None   # short explanation


# ------------------ Member Dashboard ------------------ #

class MemberCollectiveSummary(BaseModel):
    collective_id: int
    collective_name: str
    slug: Optional[str] = None
    enrolled: bool = True


class MemberDashboard(BaseModel):
    kind: Literal["member"] = "member"
    headline: str
    user_role: str
    user_type: str

    # simple high-level stats
    stats: List[StatCard] = []

    # sample recommendations or current bundles
    recommended_collectives: List[MemberCollectiveSummary] = []


# ------------------ Supplier Dashboard ------------------ #

class SupplierQuoteSummary(BaseModel):
    quote_id: int
    collective_name: str
    bundle_name: Optional[str] = None
    pmpm: float
    status: str  # e.g. "open", "accepted", "rejected"


class SupplierDashboard(BaseModel):
    kind: Literal["supplier"] = "supplier"
    headline: str
    user_role: str
    user_type: str

    stats: List[StatCard] = []
    recent_quotes: List[SupplierQuoteSummary] = []


# ------------------ Admin Dashboard ------------------ #

class AdminDashboard(BaseModel):
    kind: Literal["admin"] = "admin"
    headline: str
    user_role: str
    user_type: str

    stats: List[StatCard] = []


# ------------------ Union type exposed by /dashboard/me ------------------ #

DashboardOut = Union[MemberDashboard, SupplierDashboard, AdminDashboard]
