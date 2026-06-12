from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    name: str
    goal: str
    channel: str
    message: Optional[str] = None
    campaign_type: Optional[str] = None
    segment: Optional[str] = None
    predicted_open_rate: Optional[float] = None
    predicted_ctr: Optional[float] = None
    predicted_conversion: Optional[float] = None
    predicted_revenue: Optional[float] = None
    audience_filters: Optional[dict[str, Any]] = None
    agent_trace: Optional[list[dict[str, Any]]] = None
    decision_timeline: Optional[list[dict[str, Any]]] = None


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    goal: str
    channel: str
    status: str
    message: Optional[str] = None
    campaign_type: Optional[str] = None
    segment: Optional[str] = None
    predicted_open_rate: Optional[float] = None
    predicted_ctr: Optional[float] = None
    predicted_conversion: Optional[float] = None
    predicted_revenue: Optional[float] = None
    created_at: datetime


class CampaignListResponse(BaseModel):
    items: list[CampaignResponse]
    total: int


class CampaignLaunchResponse(BaseModel):
    campaign_id: UUID
    status: str
    message: str


class CampaignTraceResponse(BaseModel):
    campaign_id: UUID
    agent_runs: list[dict[str, Any]]
    decision_timeline: list[dict[str, Any]]


class GenerateCampaignRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=1000)
