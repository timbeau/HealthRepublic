# src/negotiations/router.py

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..users import models as user_models
from ..auth.deps import get_current_user, require_roles
from . import models, schemas
from .strategy import evaluate_offer_against_target
from ..auth.deps import get_current_user  # 👈 add this
from ..users import models as user_models   # 👈 add this

# NOTE:
# main.py already includes this router with prefix="/negotiations"
# so we do NOT set a prefix here to avoid /negotiations/negotiations.
router = APIRouter(tags=["negotiations"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_mlr(raw_mlr: float | None) -> float | None:
    """Allow MLR to be passed as 0–1 or 0–100."""
    if raw_mlr is None:
        return None
    if raw_mlr > 1.0:
        return raw_mlr / 100.0
    return raw_mlr


def _get_negotiation_or_404(db: Session, negotiation_id: int) -> models.Negotiation:
    negotiation = db.query(models.Negotiation).filter_by(id=negotiation_id).first()
    if not negotiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation not found",
        )
    return negotiation


# ---------------------------------------------------------------------------
# Core negotiation CRUD
# ---------------------------------------------------------------------------

@router.post("/start", response_model=schemas.NegotiationOut)
def start_negotiation(
    payload: schemas.NegotiationCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("admin", "collective")),
):
    """
    Start a new negotiation between a collective and a supplier.

    Restricted to:
    - admin
    - collective
    """
    negotiation = models.Negotiation(
        collective_id=payload.collective_id,
        supplier_id=payload.supplier_id,
        target_pmpm=payload.target_pmpm,
        target_population_size=payload.target_population_size,
        risk_appetite=payload.risk_appetite,
        target_start_date=payload.target_start_date,
        notes=payload.notes,
        status="open",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(negotiation)
    db.commit()
    db.refresh(negotiation)
    return negotiation

@router.get("/", response_model=List[schemas.NegotiationOut])
def list_negotiations(
    current_user: user_models.User = Depends(
        require_roles("member", "supplier", "admin")
    ),
    db: Session = Depends(get_db),
):
    """
    List negotiations visible to any authenticated user in roles:
    member, supplier, or admin.
    (For now we return all; later we can filter by user.)
    """
    negotiations = db.query(models.Negotiation).order_by(models.Negotiation.id).all()
    return negotiations


@router.get("/{negotiation_id}", response_model=schemas.NegotiationOut)
def get_negotiation(
    negotiation_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    Get a single negotiation.

    Any authenticated user can view. You can tighten this later
    (e.g., only members of that collective or supplier).
    """
    negotiation = _get_negotiation_or_404(db, negotiation_id)
    return negotiation

@router.get("/my", response_model=List[schemas.NegotiationOut])
def list_my_negotiations(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("member", "admin")),
):
    """
    Return negotiations relevant to the current member.
    For now: return ALL negotiations (you can later filter by collective_id or user_id).
    """

    # TODO: once you have a direct mapping user -> collective, filter here, e.g.:
    # negotiations = (
    #     db.query(models.Negotiation)
    #       .filter(models.Negotiation.collective_id == current_user.collective_id)
    #       .order_by(models.Negotiation.id)
    #       .all()
    # )
    negotiations = (
        db.query(models.Negotiation)
        .order_by(models.Negotiation.id)
        .all()
    )

    return negotiations


# ---------------------------------------------------------------------------
# Offers: supplier & collective
# ---------------------------------------------------------------------------

@router.post(
    "/{negotiation_id}/supplier-offer",
    response_model=schemas.OfferResponse,
    status_code=status.HTTP_201_CREATED,
)
def supplier_offer(
    negotiation_id: int,
    offer: schemas.OfferIn,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("supplier", "admin")),
):
    """
    Supplier makes an offer in this negotiation.

    Restricted to:
    - supplier
    - admin
    """
    negotiation = _get_negotiation_or_404(db, negotiation_id)

    if negotiation.status not in ("open", "in_progress"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Negotiation is not open (status={negotiation.status})",
        )

    mlr = _normalize_mlr(offer.proposed_mlr)

    # Determine round number
    next_round_number = (len(negotiation.rounds) if negotiation.rounds else 0) + 1

    round_obj = models.NegotiationRound(
        negotiation_id=negotiation.id,
        round_number=next_round_number,
        actor="supplier",
        proposed_pmpm=offer.proposed_pmpm,
        proposed_mlr=mlr,
        notes=offer.notes,
        created_at=datetime.utcnow(),
    )
    db.add(round_obj)

    # Evaluate offer vs target using strategy engine
    evaluation = evaluate_offer_against_target(
        target_pmpm=negotiation.target_pmpm,
        offer_pmpm=offer.proposed_pmpm,
        risk_appetite=negotiation.risk_appetite,
    )

    # If client explicitly flags accept AND evaluation says it's acceptable, close the deal
    if offer.accept and evaluation.is_acceptable:
        negotiation.status = "agreed"
        negotiation.final_agreed_pmpm = offer.proposed_pmpm
        negotiation.final_expected_mlr = mlr
    else:
        if negotiation.status == "open":
            negotiation.status = "in_progress"

    negotiation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(round_obj)
    db.refresh(negotiation)

    return schemas.OfferResponse(
        negotiation_id=negotiation.id,
        status=negotiation.status,
        round=round_obj,
        evaluation=evaluation,
    )


@router.post(
    "/{negotiation_id}/collective-counter",
    response_model=schemas.OfferResponse,
    status_code=status.HTTP_201_CREATED,
)
def collective_counter(
    negotiation_id: int,
    offer: schemas.OfferIn,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("collective", "admin")),
):
    """
    Collective makes a counter-offer in this negotiation.

    Restricted to:
    - collective
    - admin
    """
    negotiation = _get_negotiation_or_404(db, negotiation_id)

    if negotiation.status not in ("open", "in_progress"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Negotiation is not open (status={negotiation.status})",
        )

    mlr = _normalize_mlr(offer.proposed_mlr)

    next_round_number = (len(negotiation.rounds) if negotiation.rounds else 0) + 1

    round_obj = models.NegotiationRound(
        negotiation_id=negotiation.id,
        round_number=next_round_number,
        actor="collective",
        proposed_pmpm=offer.proposed_pmpm,
        proposed_mlr=mlr,
        notes=offer.notes,
        created_at=datetime.utcnow(),
    )
    db.add(round_obj)

    evaluation = evaluate_offer_against_target(
        target_pmpm=negotiation.target_pmpm,
        offer_pmpm=offer.proposed_pmpm,
        risk_appetite=negotiation.risk_appetite,
    )

    if offer.accept and evaluation.is_acceptable:
        negotiation.status = "agreed"
        negotiation.final_agreed_pmpm = offer.proposed_pmpm
        negotiation.final_expected_mlr = mlr
    else:
        if negotiation.status == "open":
            negotiation.status = "in_progress"

    negotiation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(round_obj)
    db.refresh(negotiation)

    return schemas.OfferResponse(
        negotiation_id=negotiation.id,
        status=negotiation.status,
        round=round_obj,
        evaluation=evaluation,
    )


# ---------------------------------------------------------------------------
# Explicit accept endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/{negotiation_id}/accept",
    response_model=schemas.NegotiationOut,
)
def accept_latest_offer(
    negotiation_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("collective", "admin")),
):
    """
    Explicitly accept the latest offer in this negotiation.

    Restricted to:
    - collective
    - admin
    """
    negotiation = _get_negotiation_or_404(db, negotiation_id)

    if not negotiation.rounds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rounds exist to accept.",
        )

    latest_round = sorted(negotiation.rounds, key=lambda r: r.round_number)[-1]

    negotiation.status = "agreed"
    negotiation.final_agreed_pmpm = latest_round.proposed_pmpm
    negotiation.final_expected_mlr = latest_round.proposed_mlr
    negotiation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(negotiation)
    return negotiation
