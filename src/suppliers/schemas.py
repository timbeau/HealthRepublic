# src/suppliers/schemas.py

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, HttpUrl, Field


# ---------------------------------------------------------------------------
# Supplier schemas
# ---------------------------------------------------------------------------

class SupplierBase(BaseModel):
    name: str = Field(..., description="Supplier name (carrier, TPA, provider group, etc.)")
    supplier_type: str = Field(
        ...,
        description="Type of supplier: e.g. 'insurer', 'tpa', 'broker', 'provider', 'other'",
    )
    contact_email: Optional[EmailStr] = Field(
        None, description="Primary contact email for this supplier"
    )
    website: Optional[HttpUrl] = Field(
        None, description="Public website URL for this supplier"
    )


class SupplierCreate(SupplierBase):
    """Payload for creating a new supplier."""
    pass


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Quote / Bid schemas
# ---------------------------------------------------------------------------

class QuoteBidBase(BaseModel):
    supplier_id: int = Field(..., description="FK to suppliers.id")
    collective_id: int = Field(..., description="FK to collectives.id")
    bundle_id: Optional[int] = Field(
        None,
        description="Optional FK to a procedure bundle (if the quote is for a specific bundle/product)",
    )

    pmpm: float = Field(..., description="Quoted PMPM rate")
    expected_mlr: Optional[float] = Field(
        None,
        description="Expected medical loss ratio (0-1 or 0-100); optional",
    )
    notes: Optional[str] = Field(
        None,
        description="Free text notes describing assumptions, limits, or structure",
    )


class QuoteBidCreate(BaseModel):
    """
    Payload for creating a new quote bid for a supplier.
    We do NOT require supplier_id here if the router infers it from path,
    but it's fine to keep it — router can ignore/override it.
    """
    collective_id: int = Field(..., description="Target collective for this quote")
    bundle_id: Optional[int] = Field(
        None,
        description="Optional bundle associated with this quote",
    )
    pmpm: float = Field(..., description="Quoted PMPM rate")
    expected_mlr: Optional[float] = Field(
        None,
        description="Expected medical loss ratio (0-1 or 0-100)",
    )
    notes: Optional[str] = Field(
        None,
        description="Any relevant context around this bid",
    )


class QuoteBidOut(QuoteBidBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
