# src/collectives/router.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..users.models import User
from ..auth.deps import get_current_user, require_roles
from . import models, schemas, services

router = APIRouter()


@router.get("/", response_model=List[schemas.CollectiveOut])
def list_collectives(db: Session = Depends(get_db)):
    collectives = db.query(models.Collective).all()
    return collectives


@router.get("/with-stats", response_model=List[schemas.CollectiveWithStats])
def list_collectives_with_stats(db: Session = Depends(get_db)):
    """
    Return all collectives plus member_count for each.
    """
    q = (
        db.query(
            models.Collective,
            func.count(models.CollectiveMembership.id).label("member_count"),
        )
        .outerjoin(
            models.CollectiveMembership,
            models.Collective.id == models.CollectiveMembership.collective_id,
        )
        .group_by(models.Collective.id)
    )

    results: List[schemas.CollectiveWithStats] = []
    for collective, member_count in q.all():
        base = schemas.CollectiveOut.model_validate(collective).model_dump()
        results.append(
            schemas.CollectiveWithStats(
                **base,
                member_count=member_count,
            )
        )
    return results


@router.post(
    "/",
    response_model=schemas.CollectiveOut,
    status_code=status.HTTP_201_CREATED,
)
def create_collective(
    collective_in: schemas.CollectiveCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    existing = (
        db.query(models.Collective)
        .filter(models.Collective.slug == collective_in.slug)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists",
        )

    collective = models.Collective(**collective_in.model_dump())
    db.add(collective)
    db.commit()
    db.refresh(collective)
    return collective


@router.post("/{collective_id}/join", response_model=schemas.CollectiveMembershipOut)
def join_collective(
    collective_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("member", "admin")),
):
    """
    Join a collective as the currently authenticated user.
    """
    membership = services.join_collective(
        db=db,
        user=current_user,
        collective_id=collective_id,
    )
    return membership


@router.post("/{collective_id}/leave")
def leave_collective(
    collective_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("member", "admin")),
):
    """
    Leave a collective as the currently authenticated user.
    """
    removed = services.leave_collective(
        db=db,
        user=current_user,
        collective_id=collective_id,
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this collective",
        )

    return {
        "message": "Left collective",
        "collective_id": collective_id,
        "user_id": current_user.id,
    }
