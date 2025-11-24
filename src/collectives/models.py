# src/collectives/models.py
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Collective(Base):
    __tablename__ = "collectives"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)

    target_industry = Column(String, nullable=True)
    target_state = Column(String, nullable=True)
    target_age_range = Column(String, nullable=True)
    min_household_size = Column(Integer, nullable=True)
    max_household_size = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    memberships = relationship(
        "CollectiveMembership",
        back_populates="collective",
        cascade="all, delete-orphan",
    )


class CollectiveMembership(Base):
    __tablename__ = "collective_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    collective_id = Column(Integer, ForeignKey("collectives.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "collective_id", name="uq_user_collective"),
    )

    user = relationship("User", back_populates="collective_memberships")
    collective = relationship("Collective", back_populates="memberships")
