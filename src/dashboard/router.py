# src/dashboard/router.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..users import models as user_models
from ..auth.deps import get_current_user, require_roles
from ..negotiations import models as negotiation_models
from ..collectives import models as collective_models

router = APIRouter()

# --------------------------------------------------------
# BASIC DASHBOARDS
# --------------------------------------------------------


@router.get("/me", summary="Generic dashboard for the logged-in user")
def my_dashboard(
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find the first collective this user belongs to (if any)
    membership = (
        db.query(collective_models.CollectiveMembership)
        .filter(collective_models.CollectiveMembership.user_id == current_user.id)
        .first()
    )

    collective_data = None
    if membership:
        collective = (
            db.query(collective_models.Collective)
            .filter(collective_models.Collective.id == membership.collective_id)
            .first()
        )
        if collective:
            collective_data = {
                "id": collective.id,
                "name": collective.name,
                "category": getattr(collective, "category", None),
            }

    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
        },
        "sections": {
            "headline": f"Welcome back, {current_user.full_name or current_user.email}",
            "role": current_user.role,
        },
        # NEW: expose the user's collective (or null if none)
        "collective": collective_data,
    }


@router.get("/member", summary="Member dashboard")
def member_dashboard(
    # role enum values (from the 422 error): "Member", "Insurance Supplier",
    # "Healthcare Provider", "admin"
    current_user: user_models.User = Depends(
        require_roles("Member", "admin")
    ),
    db: Session = Depends(get_db),
):
    return {
        "role": "member",
        "message": "Member dashboard",
        "user_id": current_user.id,
    }


@router.get("/supplier", summary="Supplier dashboard (basic)")
def supplier_dashboard(
    current_user: user_models.User = Depends(
        require_roles("Insurance Supplier", "Healthcare Provider", "admin")
    ),
    db: Session = Depends(get_db),
):
    return {
        "role": "supplier",
        "message": "Supplier dashboard",
        "user_id": current_user.id,
    }


@router.get("/admin", summary="Admin dashboard")
def admin_dashboard(
    current_user: user_models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    return {
        "role": "admin",
        "message": "Admin dashboard",
        "user_id": current_user.id,
    }


# --------------------------------------------------------
# REAL SUPPLIER PORTAL DASHBOARD
# --------------------------------------------------------


class SupplierNegotiationSummary(BaseModel):
    id: int
    collective_id: int
    supplier_id: int
    status: str
    target_pmpm: Optional[float]
    final_agreed_pmpm: Optional[float]
    last_round_actor: Optional[str]
    last_round_pmpm: Optional[float]
    last_round_mlr: Optional[float]
    last_round_created_at: Optional[datetime]
    updated_at: datetime

    class Config:
        orm_mode = True


class SupplierDashboardResponse(BaseModel):
    supplier_id: int
    email: str
    open_negotiations: List[SupplierNegotiationSummary]
    closed_negotiations: List[SupplierNegotiationSummary]


@router.get(
    "/supplier/negotiations",
    response_model=SupplierDashboardResponse,
    summary="Full provider portal negotiation dashboard",
)
def supplier_negotiation_dashboard(
    current_user: user_models.User = Depends(
        require_roles("Insurance Supplier", "Healthcare Provider", "admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Returns all negotiations where this user is the supplier.
    Segmented into open vs closed for provider portal.
    """

    supplier_id = current_user.id

    negotiations = (
        db.query(negotiation_models.Negotiation)
        .filter(negotiation_models.Negotiation.supplier_id == supplier_id)
        .order_by(negotiation_models.Negotiation.updated_at.desc())
        .all()
    )

    open_statuses = {"open", "in_progress"}
    closed_statuses = {"agreed", "cancelled", "closed"}

    open_items: List[SupplierNegotiationSummary] = []
    closed_items: List[SupplierNegotiationSummary] = []

    for n in negotiations:
        if getattr(n, "rounds", None):
            latest = sorted(n.rounds, key=lambda r: r.round_number)[-1]
            last_actor = latest.actor
            last_pmpm = latest.proposed_pmpm
            last_mlr = latest.proposed_mlr
            last_created = latest.created_at
        else:
            last_actor = None
            last_pmpm = None
            last_mlr = None
            last_created = None

        entry = SupplierNegotiationSummary(
            id=n.id,
            collective_id=n.collective_id,
            supplier_id=n.supplier_id,
            status=n.status,
            target_pmpm=n.target_pmpm,
            final_agreed_pmpm=n.final_agreed_pmpm,
            last_round_actor=last_actor,
            last_round_pmpm=last_pmpm,
            last_round_mlr=last_mlr,
            last_round_created_at=last_created,
            updated_at=n.updated_at,
        )

        if n.status in open_statuses:
            open_items.append(entry)
        else:
            closed_items.append(entry)

    return SupplierDashboardResponse(
        supplier_id=supplier_id,
        email=current_user.email,
        open_negotiations=open_items,
        closed_negotiations=closed_items,
    )


# --------------------------------------------------------
# PUBLIC OVERVIEW FOR SPLASH PAGE
# --------------------------------------------------------


class CollectiveSummary(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    member_count: int


class PublicOverviewResponse(BaseModel):
    collectives: List[CollectiveSummary]
    total_members: int
    total_insurers: int
    total_providers: int


@router.get(
    "/public/overview",
    response_model=PublicOverviewResponse,
    summary="Public overview of collectives and participation",
)
def public_overview(db: Session = Depends(get_db)):
    """
    Public, unauthenticated overview for the splash page:
    - List of collectives w/ member counts
    - Total members
    - Total insurers
    - Total providers
    """

    # ---- Collectives + member_count ----
    collectives = db.query(collective_models.Collective).all()

    summaries: List[CollectiveSummary] = []
    for c in collectives:
        # Try to infer membership relationship without exploding if it's absent
        rel = getattr(c, "members", None) or getattr(c, "users", None) or []
        try:
            member_count = len(rel)
        except TypeError:
            member_count = 0

        summaries.append(
            CollectiveSummary(
                id=c.id,
                name=c.name,
                category=getattr(c, "category", None),
                member_count=member_count,
            )
        )

    # ---- Totals by role (using enum values we know) ----
    total_members = (
        db.query(user_models.User)
        .filter(user_models.User.role == "Member")
        .count()
    )
    total_insurers = (
        db.query(user_models.User)
        .filter(user_models.User.role == "Insurance Supplier")
        .count()
    )
    total_providers = (
        db.query(user_models.User)
        .filter(user_models.User.role == "Healthcare Provider")
        .count()
    )

    return PublicOverviewResponse(
        collectives=summaries,
        total_members=total_members,
        total_insurers=total_insurers,
        total_providers=total_providers,
    )
