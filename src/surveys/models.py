# src/surveys/models.py
from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # How much care do they expect?
    expected_primary_care_visits = Column(Integer, nullable=True)      # per year
    expected_specialist_visits = Column(Integer, nullable=True)        # per year
    expected_er_urgent_visits = Column(Integer, nullable=True)         # per year

    # Mental health & telehealth
    mental_health_priority = Column(Integer, nullable=True)            # 0–10
    telehealth_priority = Column(Integer, nullable=True)               # 0–10

    # Rx usage
    monthly_rx_spend = Column(Float, nullable=True)
    brand_drug_flexibility = Column(String, nullable=True)             # "prefer_generics"|"no_preference"|"brand_only"

    # Plan design preferences
    risk_tolerance = Column(String, nullable=True)                     # "low_premium"|"balanced"|"low_deductible"
    preferred_network_type = Column(String, nullable=True)             # "HMO"|"PPO"|"EPO"|"HDHP"
    wants_hsa = Column(Boolean, nullable=True)

    # Extra flags
    needs_maternity = Column(Boolean, nullable=True)
    needs_chronic_care_management = Column(Boolean, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", backref="survey_response", uselist=False)
