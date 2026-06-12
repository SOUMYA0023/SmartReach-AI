from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    join_date: datetime
    last_order_date: Optional[datetime] = None
    total_spend: float = 0.0
    total_orders: int = 0
    segment: Optional[str] = None
    engagement_score: Optional[float] = None
    preferred_channel: Optional[str] = None


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class OrderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: float
    product_name: str
    order_date: datetime


class CustomerDetailResponse(CustomerResponse):
    orders: list[OrderSummary] = []


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    skip: int
    limit: int


class CustomerUploadResponse(BaseModel):
    created: int
    updated: int
    errors: list[str]
