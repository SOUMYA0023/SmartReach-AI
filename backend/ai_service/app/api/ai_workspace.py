from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import build_campaign_graph
from app.agents.state import CampaignState
from app.database import get_session
from app.rag.embedder import GeminiEmbedder
from app.rag.rag_service import RAGService

router = APIRouter(prefix="/ai", tags=["ai"])


class GenerateCampaignRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=1000)
    customer_data_summary: dict[str, Any] = Field(default_factory=dict)


class AgentResult(BaseModel):
    campaign_type: Optional[str] = None
    objective: Optional[str] = None
    confidence: Optional[float] = None


class AudienceResult(BaseModel):
    segment: Optional[str] = None
    size: Optional[int] = None
    confidence: Optional[float] = None
    filters: Optional[dict] = None


class ChannelResult(BaseModel):
    channel: Optional[str] = None
    confidence: Optional[float] = None


class ContentResult(BaseModel):
    message: Optional[str] = None
    subject: Optional[str] = None
    cta: Optional[str] = None
    confidence: Optional[float] = None


class ForecastResult(BaseModel):
    open_rate: Optional[float] = None
    ctr: Optional[float] = None
    conversion: Optional[float] = None
    revenue: Optional[float] = None
    confidence: Optional[float] = None


class GenerateCampaignResponse(BaseModel):
    campaign_id: Optional[UUID] = None
    planner: AgentResult
    audience: AudienceResult
    channel: ChannelResult
    content: ContentResult
    forecast: ForecastResult
    decision_timeline: list[dict[str, Any]]
    agent_trace: list[dict[str, Any]]
    errors: list[str] = []


class KnowledgeCreate(BaseModel):
    title: str
    category: str
    content: str


class KnowledgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    category: str
    content: str
    created_at: datetime


@router.post("/generate-campaign", response_model=GenerateCampaignResponse)
async def generate_campaign(body: GenerateCampaignRequest):
    """Run the full LangGraph campaign generation pipeline."""
    graph = build_campaign_graph()
    initial_state: CampaignState = {
        "goal": body.goal,
        "customer_data_summary": body.customer_data_summary,
        "campaign_type": None,
        "objective": None,
        "planner_confidence": None,
        "rag_context": None,
        "segment": None,
        "audience_size": None,
        "audience_filters": None,
        "audience_confidence": None,
        "channel": None,
        "channel_confidence": None,
        "message": None,
        "subject": None,
        "cta": None,
        "message_confidence": None,
        "open_rate": None,
        "ctr": None,
        "conversion": None,
        "revenue": None,
        "forecast_confidence": None,
        "agent_trace": [],
        "decision_timeline": [],
        "errors": [],
    }
    result = await graph.ainvoke(initial_state)
    if result.get("errors"):
        raise HTTPException(status_code=500, detail={"errors": result["errors"]})
    return GenerateCampaignResponse(
        campaign_id=None,
        planner=AgentResult(
            campaign_type=result.get("campaign_type"),
            objective=result.get("objective"),
            confidence=result.get("planner_confidence"),
        ),
        audience=AudienceResult(
            segment=result.get("segment"),
            size=result.get("audience_size"),
            confidence=result.get("audience_confidence"),
            filters=result.get("audience_filters"),
        ),
        channel=ChannelResult(
            channel=result.get("channel"),
            confidence=result.get("channel_confidence"),
        ),
        content=ContentResult(
            message=result.get("message"),
            subject=result.get("subject"),
            cta=result.get("cta"),
            confidence=result.get("message_confidence"),
        ),
        forecast=ForecastResult(
            open_rate=result.get("open_rate"),
            ctr=result.get("ctr"),
            conversion=result.get("conversion"),
            revenue=result.get("revenue"),
            confidence=result.get("forecast_confidence"),
        ),
        decision_timeline=result.get("decision_timeline", []),
        agent_trace=result.get("agent_trace", []),
        errors=result.get("errors", []),
    )


knowledge_router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@knowledge_router.post("", response_model=KnowledgeResponse)
async def create_knowledge(body: KnowledgeCreate, session: AsyncSession = Depends(get_session)):
    """Store a knowledge document with embedding."""
    embedder = GeminiEmbedder()
    rag = RAGService(session, embedder)
    doc = await rag.store_document(body.title, body.category, body.content)
    return KnowledgeResponse.model_validate(doc)
