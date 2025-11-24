# src/procedures/schemas.py
from typing import Optional, List
from pydantic import BaseModel


class ProcedureBase(BaseModel):
    code: str
    description: str
    code_system: str = "hcpcs"
    reference_cost: Optional[float] = None


class ProcedureCreate(ProcedureBase):
    pass


class ProcedureOut(ProcedureBase):
    id: int

    model_config = {"from_attributes": True}

from typing import Optional, List
from pydantic import BaseModel

# ... existing Procedure* schemas above ...


class ProcedureBundleItemCreate(BaseModel):
    procedure_code: str
    quantity: int = 1


class ProcedureBundleBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: bool = True


class ProcedureBundleCreate(ProcedureBundleBase):
    items: List[ProcedureBundleItemCreate]


class ProcedureBundleItemOut(BaseModel):
    id: int
    quantity: int
    procedure: ProcedureOut

    model_config = {"from_attributes": True}


class ProcedureBundleOut(ProcedureBundleBase):
    id: int
    items: List[ProcedureBundleItemOut]

    model_config = {"from_attributes": True}


class BundleItemEstimate(BaseModel):
    code: str
    description: str
    quantity: int
    reference_cost: Optional[float] = None
    line_total_reference_cost: Optional[float] = None


class BundleEstimateOut(BaseModel):
    bundle_id: int
    bundle_name: str
    category: Optional[str] = None
    total_reference_cost: float
    items: List[BundleItemEstimate]
