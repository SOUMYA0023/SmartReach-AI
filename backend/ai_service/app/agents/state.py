from typing import Any, Optional, TypedDict


class CampaignState(TypedDict):
    # Input
    goal: str
    customer_data_summary: dict

    # Planner output
    campaign_type: Optional[str]
    objective: Optional[str]
    planner_confidence: Optional[float]

    # RAG output
    rag_context: Optional[str]

    # Audience output
    segment: Optional[str]
    audience_size: Optional[int]
    audience_filters: Optional[dict]
    audience_confidence: Optional[float]

    # Channel output
    channel: Optional[str]
    channel_confidence: Optional[float]

    # Content output
    message: Optional[str]
    subject: Optional[str]
    cta: Optional[str]
    message_confidence: Optional[float]

    # Forecast output
    open_rate: Optional[float]
    ctr: Optional[float]
    conversion: Optional[float]
    revenue: Optional[float]
    forecast_confidence: Optional[float]

    # Meta
    agent_trace: list[dict]
    decision_timeline: list[dict]
    errors: list[str]
