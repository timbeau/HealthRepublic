# src/suppliers/router.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth.deps import get_current_user, require_roles
from ..users import models as user_models
from . import models, schemas

router = APIRouter()


# ---------------------------------------------------------------------------
# Supplier CRUD
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=schemas.SupplierOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a supplier (admin only)",
)
def create_supplier(
    supplier_in: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("admin")),
):
    """
    Create a new supplier. Restricted to admin.
    """
    supplier = models.Supplier(**supplier_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get(
    "/",
    response_model=List[schemas.SupplierOut],
    summary="List all suppliers (authenticated)",
)
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    List all suppliers. Any authenticated user can view.
    """
    suppliers = db.query(models.Supplier).all()
    return suppliers


@router.get(
    "/{supplier_id}",
    response_model=schemas.SupplierOut,
    summary="Get supplier by ID (authenticated)",
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    Get a single supplier. Any authenticated user can view.
    """
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return supplier


# ---------------------------------------------------------------------------
# Quote bidding
# ---------------------------------------------------------------------------

@router.post(
    "/{supplier_id}/quotes",
    response_model=schemas.QuoteBidOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a quote bid (supplier or admin)",
)
def create_quote_bid(
    supplier_id: int,
    bid_in: schemas.QuoteBidCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(require_roles("supplier", "admin")),
):
    """
    Create a quote bid for a collective from the given supplier.

    - Restricted to users with role 'supplier' or 'admin'.
    - Path supplier_id is treated as the owner of the bid.
    """
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    # If your schema already has supplier_id, we override it with the path param.
    data = bid_in.model_dump()
    data["supplier_id"] = supplier_id

    bid = models.QuoteBid(**data)
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return bid


@router.get(
    "/{supplier_id}/quotes",
    response_model=List[schemas.QuoteBidOut],
    summary="List all quote bids for a supplier (authenticated)",
)
def list_supplier_quotes(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    List all bids for a given supplier.
    """
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    bids = (
        db.query(models.QuoteBid)
        .filter(models.QuoteBid.supplier_id == supplier_id)
        .order_by(models.QuoteBid.created_at.desc())
        .all()
    )
    return bids


# ---------------------------------------------------------------------------
# Quotes by collective & comparison
# ---------------------------------------------------------------------------

@router.get(
    "/quotes/by-collective/{collective_id}",
    response_model=List[schemas.QuoteBidOut],
    summary="List all quote bids for a collective (authenticated)",
)
def list_collective_quotes(
    collective_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    List all quotes submitted for a given collective, across suppliers.
    """
    bids = (
        db.query(models.QuoteBid)
        .filter(models.QuoteBid.collective_id == collective_id)
        .order_by(models.QuoteBid.pmpm.asc())
        .all()
    )
    return bids


@router.get(
    "/quotes/by-collective/{collective_id}/compare",
    summary="Compare quotes for a collective (authenticated)",
)
def compare_collective_quotes(
    collective_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user),
):
    """
    Compare quotes for a collective across suppliers.

    Returns a lightweight comparison payload sorted by PMPM.
    """
    bids = (
        db.query(models.QuoteBid)
        .filter(models.QuoteBid.collective_id == collective_id)
        .order_by(models.QuoteBid.pmpm.asc())
        .all()
    )

    if not bids:
        return {
            "collective_id": collective_id,
            "results": [],
            "message": "No bids found for this collective.",
        }

    comparisons = []
    for idx, bid in enumerate(bids, start=1):
        comparisons.append(
            {
                "rank": idx,
                "quote_id": bid.id,
                "supplier_id": bid.supplier_id,
                "collective_id": bid.collective_id,
                "pmpm": bid.pmpm,
                "metal_tier": getattr(bid, "metal_tier", None),
                "expected_mlr": getattr(bid, "expected_mlr", None),
                "notes": getattr(bid, "notes", None),
                "created_at": bid.created_at,
            }
        )

    return {
        "collective_id": collective_id,
        "results": comparisons,
        "count": len(comparisons),
    }
