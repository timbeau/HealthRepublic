# src/users/models.py
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Core identity / auth
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    user_type = Column(String, nullable=False, default="individual")  # individual | business | supplier
    full_name = Column(String, nullable=True)

    # Demographic / profile
    state = Column(String, nullable=True)
    age_range = Column(String, nullable=True)      # e.g. "25-34", "35-44"
    industry = Column(String, nullable=True)       # e.g. "creative", "gig", "tech"
    household_size = Column(Integer, nullable=True)

    # Role of User
    role = Column(String, default="member", nullable=False)

    # Current coverage info
    current_premium_monthly = Column(Float, nullable=True)
    current_metal_tier = Column(String, nullable=True)  # e.g. Bronze / Silver / Gold / Platinum

    # 🔹 NEW: richer profile fields
    household_income = Column(Float, nullable=True)  # yearly, for subsidy modeling

    # store as comma-separated list for now, e.g. "diabetes,hypertension"
    chronic_conditions = Column(Text, nullable=True)

    # free-form text for now, e.g. "Kaiser, HCA Houston, UT Southwestern"
    preferred_providers = Column(Text, nullable=True)

    # free-form text list: "metformin,atorvastatin,ozempic"
    prescription_list = Column(Text, nullable=True)

    # 0–10: how important telehealth is
    telehealth_priority = Column(Integer, nullable=True)

    # risk attitude: "low_premium" | "balanced" | "low_deductible"
    risk_tolerance = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
 # 🔹 NEW: membership relationship
    collective_memberships = relationship(
        "CollectiveMembership",
        back_populates="user",
        cascade="all, delete-orphan",
    )
