# src/collectives/services.py
from typing import List

from sqlalchemy.orm import Session

from . import models, schemas
from ..users.models import User

# ----- Matching weights (existing) -----
INDUSTRY_MATCH_POINTS = 40
STATE_MATCH_POINTS = 25
AGE_RANGE_MATCH_POINTS = 20
HOUSEHOLD_IN_RANGE_POINTS = 10
HOUSEHOLD_TOO_SMALL_PENALTY = -5
HOUSEHOLD_TOO_LARGE_PENALTY = -5


def score_collective_for_user(user: User, collective: models.Collective) -> int:
    score = 0

    # Industry
    if collective.target_industry and user.industry:
        if collective.target_industry.lower() == user.industry.lower():
            score += INDUSTRY_MATCH_POINTS

    # State
    if collective.target_state and user.state:
        if collective.target_state.upper() == user.state.upper():
            score += STATE_MATCH_POINTS

    # Age range
    if collective.target_age_range and user.age_range:
        if collective.target_age_range == user.age_range:
            score += AGE_RANGE_MATCH_POINTS

    # Household size
    if user.household_size is not None:
        in_range = True

        if (
            collective.min_household_size is not None
            and user.household_size < collective.min_household_size
        ):
            score += HOUSEHOLD_TOO_SMALL_PENALTY
            in_range = False

        if (
            collective.max_household_size is not None
            and user.household_size > collective.max_household_size
        ):
            score += HOUSEHOLD_TOO_LARGE_PENALTY
            in_range = False

        if in_range and (
            collective.min_household_size is not None
            or collective.max_household_size is not None
        ):
            score += HOUSEHOLD_IN_RANGE_POINTS

    return score


def recommend_collectives_for_user(
    db: Session,
    user: User,
    limit: int = 5,
    min_score: int = 10,
) -> List[schemas.CollectiveRecommendation]:
    collectives = db.query(models.Collective).all()

    scored: List[schemas.CollectiveRecommendation] = []
    for c in collectives:
        s = score_collective_for_user(user, c)
        if s >= min_score:
            scored.append(
                schemas.CollectiveRecommendation(
                    collective=schemas.CollectiveOut.model_validate(c),
                    score=s,
                )
            )

    scored.sort(key=lambda cr: cr.score, reverse=True)
    return scored[:limit]


def join_collective(db: Session, user: User, collective_id: int) -> models.CollectiveMembership:
    collective = (
        db.query(models.Collective)
        .filter(models.Collective.id == collective_id)
        .first()
    )
    if not collective:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collective not found",
        )

    existing = (
        db.query(models.CollectiveMembership)
        .filter(
            models.CollectiveMembership.user_id == user.id,
            models.CollectiveMembership.collective_id == collective_id,
        )
        .first()
    )
    if existing:
        return existing

    membership = models.CollectiveMembership(
        user_id=user.id,
        collective_id=collective_id,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def leave_collective(db: Session, user: User, collective_id: int) -> bool:
    membership = (
        db.query(models.CollectiveMembership)
        .filter(
            models.CollectiveMembership.user_id == user.id,
            models.CollectiveMembership.collective_id == collective_id,
        )
        .first()
    )
    if not membership:
        return False

    db.delete(membership)
    db.commit()
    return True
