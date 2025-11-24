# src/procedures/router.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from . import models, schemas

router = APIRouter()


# ---------- BASIC PROCEDURE SEARCH / LOOKUP ----------

@router.get(
    "/",
    response_model=List[schemas.ProcedureOut],
    summary="Search or list procedures (CPT/HCPCS)"
)
def list_procedures(
    q: Optional[str] = Query(
        None,
        description="Search term for code or description (partial match).",
    ),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(models.Procedure)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Procedure.code.ilike(like),
                models.Procedure.description.ilike(like),
            )
        )

    procedures = query.order_by(models.Procedure.code).limit(limit).all()
    return procedures


@router.get(
    "/{code}",
    response_model=schemas.ProcedureOut,
    summary="Get a single procedure by code",
)
def get_procedure_by_code(
    code: str,
    db: Session = Depends(get_db),
):
    proc = (
        db.query(models.Procedure)
        .filter(models.Procedure.code == code)
        .first()
    )
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return proc


# ---------- BUNDLES / PACKS ----------

@router.post(
    "/bundles/",
    response_model=schemas.ProcedureBundleOut,
    summary="Create a procedure bundle (e.g., annual physical panel)",
)
def create_procedure_bundle(
    bundle_in: schemas.ProcedureBundleCreate,
    db: Session = Depends(get_db),
):
    codes = [item.procedure_code.strip() for item in bundle_in.items]
    if not codes:
        raise HTTPException(status_code=400, detail="Bundle must contain at least one procedure.")

    procedures = (
        db.query(models.Procedure)
        .filter(models.Procedure.code.in_(codes))
        .all()
    )
    proc_by_code = {p.code: p for p in procedures}

    missing = [c for c in codes if c not in proc_by_code]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown procedure codes in bundle: {missing}",
        )

    bundle = models.ProcedureBundle(
        name=bundle_in.name,
        description=bundle_in.description,
        category=bundle_in.category,
        is_active=bundle_in.is_active,
    )
    db.add(bundle)
    db.flush()  # to get bundle.id

    for item in bundle_in.items:
        proc = proc_by_code[item.procedure_code.strip()]
        db.add(
            models.ProcedureBundleItem(
                bundle_id=bundle.id,
                procedure_id=proc.id,
                quantity=item.quantity or 1,
            )
        )

    db.commit()
    db.refresh(bundle)
    return bundle


@router.get(
    "/bundles/",
    response_model=List[schemas.ProcedureBundleOut],
    summary="List procedure bundles",
)
def list_procedure_bundles(
    category: Optional[str] = Query(
        None,
        description="Filter by category (e.g., primary_care, diabetes, maternity)",
    ),
    db: Session = Depends(get_db),
):
    q = db.query(models.ProcedureBundle).filter(models.ProcedureBundle.is_active.is_(True))
    if category:
        q = q.filter(models.ProcedureBundle.category == category)
    bundles = q.order_by(models.ProcedureBundle.name).all()
    return bundles


@router.get(
    "/bundles/{bundle_id}",
    response_model=schemas.ProcedureBundleOut,
    summary="Get a single procedure bundle by ID",
)
def get_procedure_bundle(
    bundle_id: int,
    db: Session = Depends(get_db),
):
    bundle = db.query(models.ProcedureBundle).get(bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return bundle


@router.get(
    "/bundles/{bundle_id}/estimate",
    response_model=schemas.BundleEstimateOut,
    summary="Estimate total reference cost for a bundle (sum of procedure reference costs)",
)
def estimate_bundle_reference_cost(
    bundle_id: int,
    db: Session = Depends(get_db),
):
    bundle = (
        db.query(models.ProcedureBundle)
        .filter(models.ProcedureBundle.id == bundle_id)
        .first()
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    items_out: list[schemas.BundleItemEstimate] = []
    total = 0.0

    for item in bundle.items:
        proc = item.procedure
        ref = proc.reference_cost or 0.0
        line_total = ref * (item.quantity or 1)

        if proc.reference_cost is not None:
            total += line_total

        items_out.append(
            schemas.BundleItemEstimate(
                code=proc.code,
                description=proc.description,
                quantity=item.quantity,
                reference_cost=proc.reference_cost,
                line_total_reference_cost=(
                    line_total if proc.reference_cost is not None else None
                ),
            )
        )

    return schemas.BundleEstimateOut(
        bundle_id=bundle.id,
        bundle_name=bundle.name,
        category=bundle.category,
        total_reference_cost=total,
        items=items_out,
    )
