# src/negotiations/services.py
from typing import Tuple, Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..users.models import User
from ..collectives.models import Collective, CollectiveMembership
from ..surveys.models import SurveyResponse
from ..suppliers.models import Supplier, SupplierBid
from . import schemas


def _age_factor(age_range: Optional[str]) -> float:
    if not age_range:
        return 1.0
    ar = age_range.strip()
    mapping = {
        "18-24": 0.8,
        "25-34": 0.9,
        "35-44": 1.0,
        "45-54": 1.1,
        "55-64": 1.3,
        "65+": 1.6,
    }
    return mapping.get(ar, 1.0)


def compute_collective_risk(
    db: Session,
    collective_id: int,
) -> Tuple[int, float, Optional[float], float]:
    """
    Returns:
        member_count,
        risk_score (>= 0.5, usually 0.8–1.6),
        avg_monthly_rx_spend (or None),
        avg_chronic_conditions_per_user
    """
    # members of this collective
    q_members = (
        db.query(User)
        .join(
            CollectiveMembership,
            CollectiveMembership.user_id == User.id,
        )
        .filter(CollectiveMembership.collective_id == collective_id)
    )

    members: List[User] = q_members.all()
    member_count = len(members)
    if member_count == 0:
        # no data — neutral risk score
        return 0, 1.0, None, 0.0

    # age factor
    age_factors = [_age_factor(u.age_range) for u in members]
    avg_age_factor = sum(age_factors) / len(age_factors)

    # chronic conditions — naive comma split
    total_conditions = 0
    for u in members:
        if u.chronic_conditions:
            parts = [p.strip() for p in u.chronic_conditions.split(",")]
            total_conditions += len([p for p in parts if p])

    avg_chronic_per_user = total_conditions / member_count if member_count > 0 else 0.0

    # survey-based RX spend
    q_rx = (
        db.query(func.avg(SurveyResponse.monthly_rx_spend))
        .join(User, User.id == SurveyResponse.user_id)
        .join(
            CollectiveMembership,
            CollectiveMembership.user_id == User.id,
        )
        .filter(CollectiveMembership.collective_id == collective_id)
        .filter(SurveyResponse.monthly_rx_spend.is_not(None))
    )

    avg_rx = q_rx.scalar()
    avg_rx = float(avg_rx) if avg_rx is not None else None

    # Build risk score
    # base from age
    risk = avg_age_factor

    # add 5% per avg chronic condition
    risk += 0.05 * avg_chronic_per_user

    # add 0–20% based on RX spend (0–400+ mapped to 0–0.2)
    if avg_rx is not None:
        rx_factor = min(avg_rx / 400.0, 1.0) * 0.2
        risk += rx_factor

    # clamp
    risk = max(0.5, min(risk, 2.5))

    return member_count, risk, avg_rx, avg_chronic_per_user


def simulate_insurer_bids_for_collective(
    db: Session,
    collective: Collective,
) -> schemas.CollectiveQuoteResponse:
    member_count, risk_score, avg_rx, avg_chronic = compute_collective_risk(
        db=db, collective_id=collective.id
    )

    # baseline: individual market premium per member (rough demo assumption)
    baseline_individual_premium = 650.0

    # base premium per member for this group, before size discounts
    base_premium = 500.0 * risk_score

    # size discount factor
    if member_count >= 200:
        size_discount_factor = 0.15
    elif member_count >= 50:
        size_discount_factor = 0.10
    elif member_count >= 10:
        size_discount_factor = 0.05
    else:
        size_discount_factor = 0.0

    insurers = (
        db.query(Supplier)
        .filter(Supplier.supplier_type == "insurer")
        .all()
    )

    quotes: List[schemas.SupplierQuote] = []

    for supplier in insurers:
        # deterministic "random-ish" variation based on supplier id
        # id % 5 -> 0..4 -> shift around -4%..+4%
        offset_bucket = supplier.id % 5  # 0,1,2,3,4
        supplier_variation_factor = (offset_bucket - 2) * 0.02  # -0.04 .. +0.04

        effective_discount = size_discount_factor + supplier_variation_factor
        # clamp to [0, 0.25] so it doesn’t go weird
        effective_discount = max(0.0, min(effective_discount, 0.25))

        final_premium = base_premium * (1.0 - effective_discount)

        # savings vs individual market
        estimated_savings_percent = (
            (baseline_individual_premium - final_premium) / baseline_individual_premium
        ) * 100.0

        quote = schemas.SupplierQuote(
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            supplier_type=supplier.supplier_type,
            bid_type="insurance_premium",
            collective_id=collective.id,
            member_count=member_count,
            risk_score=round(risk_score, 3),
            base_premium=round(base_premium, 2),
            size_discount_factor=round(size_discount_factor, 3),
            supplier_variation_factor=round(supplier_variation_factor, 3),
            final_premium=round(final_premium, 2),
            estimated_savings_percent=round(estimated_savings_percent, 1),
        )
        quotes.append(quote)

        # Optionally persist as SupplierBid for later analytics
        bid = SupplierBid(
            supplier_id=supplier.id,
            collective_id=collective.id,
            bid_type="insurance_premium",
            monthly_premium=final_premium,
            discount_percent=effective_discount * 100.0,
            notes="Simulated via quote-bidding engine",
        )
        db.add(bid)

    if insurers:
        db.commit()

    quotes.sort(key=lambda q: q.final_premium)

    return schemas.CollectiveQuoteResponse(
        collective_id=collective.id,
        collective_name=collective.name,
        member_count=member_count,
        avg_monthly_rx_spend=avg_rx,
        avg_chronic_conditions_per_user=round(avg_chronic, 2),
        risk_score=round(risk_score, 3),
        quotes=quotes,
    )
