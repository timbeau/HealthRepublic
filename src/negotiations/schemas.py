# src/negotiations/schemas.py

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

class NegotiationMessageBase(BaseModel):
    sender_type: str = Field(
        ...,
        description="Who sent the message: 'collective', 'supplier', or 'system'",
    )
    sender_name: Optional[str] = Field(
        None, description="Human readable name (e.g., 'Aetna rep', 'Collective lead')"
    )
    body: str = Field(..., description="Message content")


class NegotiationMessageCreate(NegotiationMessageBase):
    pass


class NegotiationMessageOut(NegotiationMessageBase):
    id: int
    negotiation_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Rounds / Offers
# ---------------------------------------------------------------------------

class NegotiationRoundOut(BaseModel):
    id: int
    negotiation_id: int
    round_number: int
    actor: str = Field(..., description="'supplier' or 'collective'")
    proposed_pmpm: float
    proposed_mlr: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FairValueEvaluation(BaseModel):
    target_pmpm: Optional[float]
    offer_pmpm: float
    percent_from_target: Optional[float]
    fair_band_min: Optional[float]
    fair_band_max: Optional[float]
    is_acceptable: bool
    recommended_action: str = Field(
        ...,
        description="One of: 'accept', 'counter', 'walk_away'",
    )
    suggested_counter_pmpm: Optional[float] = Field(
        None,
        description="If recommended_action == 'counter', a suggested counter PMPM.",
    )


class OfferIn(BaseModel):
    proposed_pmpm: float = Field(..., description="Offered PMPM rate")
    proposed_mlr: Optional[float] = Field(
        None, description="Expected medical loss ratio (0-1 or 0-100)"
    )
    notes: Optional[str] = None
    accept: bool = Field(
        False,
        description="If true, this offer will be treated as an acceptance/close if allowed",
    )


class OfferResponse(BaseModel):
    negotiation_id: int
    status: str
    round: NegotiationRoundOut
    evaluation: FairValueEvaluation


# ---------------------------------------------------------------------------
# Negotiation objects
# ---------------------------------------------------------------------------

class NegotiationBase(BaseModel):
    collective_id: int
    supplier_id: int
    target_pmpm: Optional[float] = Field(
        None,
        description="Target PMPM for the collective (used as anchor for fair value)",
    )
    target_population_size: Optional[int] = Field(
        None, description="Number of members expected in this deal"
    )
    risk_appetite: Optional[str] = Field(
        "medium", description="Risk appetite: low, medium, high"
    )
    target_start_date: Optional[date] = None
    notes: Optional[str] = None


class NegotiationCreate(NegotiationBase):
    pass


class NegotiationOut(NegotiationBase):
    id: int
    status: str
    final_agreed_pmpm: Optional[float] = None
    final_expected_mlr: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    rounds: List[NegotiationRoundOut] = []
    messages: List[NegotiationMessageOut] = []

    model_config = {"from_attributes": True}
