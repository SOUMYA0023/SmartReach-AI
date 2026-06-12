from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.rate_limit import limiter
from app.schemas.analytics import CampaignAnalyticsResponse, PredictedVsActual
from app.schemas.campaign import (
    CampaignCreate,
    CampaignLaunchResponse,
    CampaignListResponse,
    CampaignResponse,
    CampaignTraceResponse,
    GenerateCampaignRequest,
)
from app.security.prompt_guard import PromptGuardService
from app.services.analytics_service import AnalyticsService
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/campaigns", tags=["campaigns"])
prompt_guard = PromptGuardService()


@router.post("/generate", response_model=dict)
@limiter.limit("10/minute")
async def generate_campaign(
    request: Request,
    body: GenerateCampaignRequest,
    session: AsyncSession = Depends(get_session),
):
    """Generate a campaign plan using the AI service."""
    prompt_guard.validate(body.goal)
    service = CampaignService(session)
    return await service.generate_via_ai(body.goal)


@router.post("", response_model=CampaignResponse)
@limiter.limit("10/minute")
async def create_campaign(
    request: Request,
    body: CampaignCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new campaign."""
    prompt_guard.validate(body.name)
    prompt_guard.validate(body.goal)
    if body.message:
        prompt_guard.validate(body.message)
    service = CampaignService(session)
    campaign = await service.create_campaign(body)
    return CampaignResponse.model_validate(campaign)


@router.get("", response_model=CampaignListResponse)
@limiter.limit("60/minute")
async def list_campaigns(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    """List all campaigns."""
    service = CampaignService(session)
    campaigns, total = await service.list_campaigns(skip=skip, limit=limit)
    return CampaignListResponse(
        items=[CampaignResponse.model_validate(c) for c in campaigns],
        total=total,
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
@limiter.limit("60/minute")
async def get_campaign(
    request: Request,
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get campaign details."""
    service = CampaignService(session)
    campaign = await service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse.model_validate(campaign)


@router.post("/{campaign_id}/launch", response_model=CampaignLaunchResponse)
@limiter.limit("5/minute")
async def launch_campaign(
    request: Request,
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Launch a campaign — dispatches messages via Celery."""
    service = CampaignService(session)
    try:
        campaign = await service.launch_campaign(campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return CampaignLaunchResponse(
        campaign_id=campaign.id,
        status=campaign.status,
        message="Campaign launch initiated",
    )


@router.get("/{campaign_id}/analytics", response_model=CampaignAnalyticsResponse)
@limiter.limit("60/minute")
async def get_campaign_analytics(
    request: Request,
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get campaign performance analytics with predicted vs actual comparison."""
    service = AnalyticsService(session)
    try:
        data = await service.get_campaign_analytics(campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    pva = data.pop("predicted_vs_actual")
    return CampaignAnalyticsResponse(
        **data,
        campaign_id=campaign_id,
        predicted_vs_actual={k: PredictedVsActual(**v) for k, v in pva.items()},
    )


@router.get("/{campaign_id}/trace", response_model=CampaignTraceResponse)
@limiter.limit("60/minute")
async def get_campaign_trace(
    request: Request,
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get agent run trace and decision timeline for a campaign."""
    service = CampaignService(session)
    campaign = await service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    trace = await service.get_trace(campaign_id)
    return CampaignTraceResponse(**trace)
