# src/negotiations/strategy.py

from typing import Optional

from .schemas import FairValueEvaluation


def evaluate_offer_against_target(
    target_pmpm: Optional[float],
    offer_pmpm: float,
    risk_appetite: Optional[str] = "medium",
) -> FairValueEvaluation:
    """
    Simple rule-based strategy engine.

    - If no target_pmpm is set: we can't do “fair value”, so we just say:
      - is_acceptable=True, recommended_action="accept".
    - Otherwise:
      * Compute % distance from target.
      * Use risk_appetite to set a 'fair' band (±X% around target).
      * Decide accept / counter / walk_away.
      * If counter: propose a counter PMPM between target and offer.
    """

    # No target => just accept for now (you can tighten this later)
    if target_pmpm is None or target_pmpm <= 0:
        return FairValueEvaluation(
            target_pmpm=None,
            offer_pmpm=offer_pmpm,
            percent_from_target=None,
            fair_band_min=None,
            fair_band_max=None,
            is_acceptable=True,
            recommended_action="accept",
            suggested_counter_pmpm=None,
        )

    # Risk appetite → fair band width
    ra = (risk_appetite or "medium").lower()
    if ra == "low":
        band = 0.03  # ±3%
    elif ra == "high":
        band = 0.08  # ±8%
    else:
        band = 0.05  # ±5% default

    fair_band_min = target_pmpm * (1 - band)
    fair_band_max = target_pmpm * (1 + band)

    # Percent difference
    percent_from_target = (offer_pmpm - target_pmpm) / target_pmpm

    abs_diff = abs(percent_from_target)

    # Decision logic:
    # - Inside fair band  => accept
    # - Within ~2x band   => counter
    # - Beyond that       => walk away (or very hard counter)
    if fair_band_min <= offer_pmpm <= fair_band_max:
        # Accept range
        return FairValueEvaluation(
            target_pmpm=target_pmpm,
            offer_pmpm=offer_pmpm,
            percent_from_target=percent_from_target,
            fair_band_min=fair_band_min,
            fair_band_max=fair_band_max,
            is_acceptable=True,
            recommended_action="accept",
            suggested_counter_pmpm=None,
        )

    # Outside fair band
    recommended_action: str
    suggested_counter_pmpm: Optional[float] = None

    if abs_diff <= band * 2:
        recommended_action = "counter"

        # Counter between target and offer, biased 60% toward target
        # If offer is higher than target, this pulls down toward target
        # If offer is lower (very generous), we basically accept.
        weight_toward_target = 0.6
        suggested_counter_pmpm = (
            target_pmpm * weight_toward_target
            + offer_pmpm * (1 - weight_toward_target)
        )

        # Ensure we don't counter *worse* than offer if offer is already better than target
        if offer_pmpm < target_pmpm and suggested_counter_pmpm is not None:
            suggested_counter_pmpm = min(suggested_counter_pmpm, offer_pmpm)

    else:
        recommended_action = "walk_away"

    return FairValueEvaluation(
        target_pmpm=target_pmpm,
        offer_pmpm=offer_pmpm,
        percent_from_target=percent_from_target,
        fair_band_min=fair_band_min,
        fair_band_max=fair_band_max,
        is_acceptable=(recommended_action == "accept"),
        recommended_action=recommended_action,
        suggested_counter_pmpm=suggested_counter_pmpm,
    )
