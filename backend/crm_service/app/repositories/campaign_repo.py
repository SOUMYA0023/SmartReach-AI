from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AgentRun, DecisionTimeline
from app.models.campaign import Campaign, CampaignAudience
from app.repositories.base import BaseRepository


class CampaignRepository(BaseRepository[Campaign]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Campaign)

    async def list_all(self, skip: int = 0, limit: int = 100) -> tuple[list[Campaign], int]:
        total = (await self.session.execute(select(func.count()).select_from(Campaign))).scalar_one()
        result = await self.session.execute(
            select(Campaign).order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_with_audience(self, id: UUID) -> Optional[Campaign]:
        result = await self.session.execute(
            select(Campaign).options(selectinload(Campaign.audiences)).where(Campaign.id == id)
        )
        return result.scalar_one_or_none()


class CampaignAudienceRepository(BaseRepository[CampaignAudience]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CampaignAudience)

    async def get_by_campaign(self, campaign_id: UUID) -> list[CampaignAudience]:
        result = await self.session.execute(
            select(CampaignAudience).where(CampaignAudience.campaign_id == campaign_id)
        )
        return list(result.scalars().all())

    async def bulk_create(self, audiences: list[CampaignAudience]) -> list[CampaignAudience]:
        self.session.add_all(audiences)
        await self.session.flush()
        return audiences

    async def count_by_campaign(self, campaign_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(CampaignAudience).where(
                CampaignAudience.campaign_id == campaign_id
            )
        )
        return result.scalar_one()


class AgentRunRepository(BaseRepository[AgentRun]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AgentRun)

    async def get_by_campaign(self, campaign_id: UUID) -> list[AgentRun]:
        result = await self.session.execute(
            select(AgentRun).where(AgentRun.campaign_id == campaign_id).order_by(AgentRun.created_at)
        )
        return list(result.scalars().all())


class DecisionTimelineRepository(BaseRepository[DecisionTimeline]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, DecisionTimeline)

    async def get_by_campaign(self, campaign_id: UUID) -> list[DecisionTimeline]:
        result = await self.session.execute(
            select(DecisionTimeline)
            .where(DecisionTimeline.campaign_id == campaign_id)
            .order_by(DecisionTimeline.created_at)
        )
        return list(result.scalars().all())

    async def bulk_create(self, entries: list[DecisionTimeline]) -> list[DecisionTimeline]:
        self.session.add_all(entries)
        await self.session.flush()
        return entries
