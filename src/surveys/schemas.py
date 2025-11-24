# src/surveys/schemas.py
from typing import Optional, List, Literal

from pydantic import BaseModel


class SurveyResponseBase(BaseModel):
    expected_primary_care_visits: Optional[int] = None
    expected_specialist_visits: Optional[int] = None
    expected_er_urgent_visits: Optional[int] = None

    mental_health_priority: Optional[int] = None     # 0–10
    telehealth_priority: Optional[int] = None        # 0–10

    monthly_rx_spend: Optional[float] = None
    brand_drug_flexibility: Optional[
        Literal["prefer_generics", "no_preference", "brand_only"]
    ] = None

    risk_tolerance: Optional[
        Literal["low_premium", "balanced", "low_deductible"]
    ] = None

    preferred_network_type: Optional[
        Literal["HMO", "PPO", "EPO", "HDHP"]
    ] = None

    wants_hsa: Optional[bool] = None

    needs_maternity: Optional[bool] = None
    needs_chronic_care_management: Optional[bool] = None


class SurveyResponseCreate(SurveyResponseBase):
    user_id: int  # we’ll pass this explicitly for now


class SurveyResponseOut(SurveyResponseBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


# For UI: static questions description

class SurveyQuestionOption(BaseModel):
    value: str
    label: str


class SurveyQuestion(BaseModel):
    id: str
    label: str
    help_text: Optional[str] = None
    type: str  # "int" | "float" | "select" | "boolean"
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[SurveyQuestionOption]] = None
