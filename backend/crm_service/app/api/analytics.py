from fastapi import APIRouter, Depends
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.rate_limit import limiter
from app.schemas.analytics import DashboardResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
@limiter.limit("60/minute")
async def get_dashboard(request: Request, session: AsyncSession = Depends(get_session)):
    """Get global dashboard metrics."""
    service = AnalyticsService(session)
    data = await service.get_dashboard()
    return DashboardResponse(**data)
