# src/suppliers/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    supplier_type = Column(
        String, nullable=False
    )  # "insurer" | "pharmacy" | "pharma_manufacturer"
    contact_email = Column(String, nullable=True)
    website = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bids = relationship("SupplierBid", back_populates="supplier", cascade="all, delete-orphan")


class SupplierBid(Base):
    __tablename__ = "supplier_bids"

    id = Column(Integer, primary_key=True, index=True)

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # optional target
    collective_id = Column(Integer, ForeignKey("collectives.id"), nullable=True)

    bid_type = Column(
        String, nullable=False
    )  # "insurance_premium" | "rx_discount" | "telehealth_bundle"

    # basic economics for demo
    monthly_premium = Column(Float, nullable=True)          # for insurance bids
    discount_percent = Column(Float, nullable=True)         # for pharmacy / pharma bids
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    supplier = relationship("Supplier", back_populates="bids")
