# src/negotiations/models.py
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from ..database import Base


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    collective_id = Column(Integer, index=True, nullable=False)
    supplier_id = Column(Integer, index=True, nullable=False)

    status = Column(
        String,
        default="open",  # open, in_progress, closed, cancelled
        index=True,
        nullable=False,
    )

    # Actuarial inputs
    target_pmpm = Column(Float, nullable=True)
    target_population_size = Column(Integer, nullable=True)
    risk_appetite = Column(String, default="medium")  # low / medium / high
    target_start_date = Column(Date, nullable=True)

    notes = Column(String, nullable=True)

    # Final agreed terms
    final_agreed_pmpm = Column(Float, nullable=True)
    final_expected_mlr = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # --- Relationships ---
    rounds = relationship(
        "NegotiationRound",
        back_populates="negotiation",
        cascade="all, delete-orphan",
        order_by="NegotiationRound.round_number",
    )

    messages = relationship(
        "NegotiationMessage",
        back_populates="negotiation",
        cascade="all, delete-orphan",
        order_by="NegotiationMessage.created_at",
    )


class NegotiationRound(Base):
    __tablename__ = "negotiation_rounds"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_id = Column(
        Integer,
        ForeignKey("negotiations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    round_number = Column(Integer, nullable=False)
    actor = Column(String, nullable=False)  # "supplier" or "collective"

    proposed_pmpm = Column(Float, nullable=True)
    proposed_mlr = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    negotiation = relationship(
        "Negotiation",
        back_populates="rounds",
    )


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_id = Column(
        Integer,
        ForeignKey("negotiations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_type = Column(String, nullable=False)  # "collective" / "supplier" / "system"
    sender_name = Column(String, nullable=True)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    negotiation = relationship(
        "Negotiation",
        back_populates="messages",
    )
