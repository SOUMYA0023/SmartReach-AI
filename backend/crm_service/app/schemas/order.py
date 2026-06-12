from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    amount: float
    product_name: str
    order_date: datetime
    created_at: datetime


class OrderUploadResponse(BaseModel):
    created: int
    errors: list[str]
