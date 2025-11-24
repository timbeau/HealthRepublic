# src/procedures/models.py

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    code_system = Column(String, nullable=False, default="hcpcs")
    reference_cost = Column(Float, nullable=True)


class ProcedureBundle(Base):
    __tablename__ = "procedure_bundles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # e.g. "primary_care", "diabetes", "maternity"
    is_active = Column(Boolean, nullable=False, default=True)

    items = relationship(
        "ProcedureBundleItem",
        back_populates="bundle",
        cascade="all, delete-orphan",
    )


class ProcedureBundleItem(Base):
    __tablename__ = "procedure_bundle_items"

    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(
        Integer,
        ForeignKey("procedure_bundles.id", ondelete="CASCADE"),
        nullable=False,
    )
    procedure_id = Column(
        Integer,
        ForeignKey("procedures.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity = Column(Integer, nullable=False, default=1)

    bundle = relationship("ProcedureBundle", back_populates="items")
    procedure = relationship("Procedure")
