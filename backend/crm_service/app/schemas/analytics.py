from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class PredictedVsActual(BaseModel):
    predicted: Optional[float] = None
    actual: Optional[float] = None


class CampaignAnalyticsResponse(BaseModel):
    campaign_id: UUID
    audience_size: int
    sent: int
    delivered: int
    opened: int
    clicked: int
    converted: int
    failed: int
    delivery_rate: float
    open_rate: float
    ctr: float
    conversion_rate: float
    predicted_vs_actual: dict[str, PredictedVsActual]


class DashboardResponse(BaseModel):
    total_customers: int
    total_campaigns: int
    avg_open_rate: float
    total_converted: int
    top_performing_channel: str
    segment_distribution: dict[str, int]
    total_sent: int = 0
    total_delivered: int = 0
    total_opened: int = 0
    total_clicked: int = 0
