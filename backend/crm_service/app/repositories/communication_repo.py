from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Communication, CommunicationEvent
from app.repositories.base import BaseRepository


class CommunicationRepository(BaseRepository[Communication]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Communication)

    async def get_by_campaign(self, campaign_id: UUID) -> list[Communication]:
        result = await self.session.execute(
            select(Communication).where(Communication.campaign_id == campaign_id)
        )
        return list(result.scalars().all())

    async def count_by_status(self, campaign_id: UUID, status: str) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Communication)
            .where(Communication.campaign_id == campaign_id, Communication.status == status)
        )
        return result.scalar_one()

    async def status_counts(self, campaign_id: UUID) -> dict[str, int]:
        result = await self.session.execute(
            select(Communication.status, func.count())
            .where(Communication.campaign_id == campaign_id)
            .group_by(Communication.status)
        )
        return {status: count for status, count in result.all()}


class CommunicationEventRepository(BaseRepository[CommunicationEvent]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CommunicationEvent)

    async def get_by_communication(self, communication_id: UUID) -> list[CommunicationEvent]:
        result = await self.session.execute(
            select(CommunicationEvent)
            .where(CommunicationEvent.communication_id == communication_id)
            .order_by(CommunicationEvent.timestamp)
        )
        return list(result.scalars().all())

    async def event_exists(self, communication_id: UUID, event_type: str) -> bool:
        result = await self.session.execute(
            select(func.count())
            .select_from(CommunicationEvent)
            .where(
                CommunicationEvent.communication_id == communication_id,
                CommunicationEvent.event_type == event_type,
            )
        )
        return result.scalar_one() > 0
