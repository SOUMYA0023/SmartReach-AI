from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import STATUS_PROGRESSION, Communication, CommunicationEvent
from app.repositories.communication_repo import CommunicationEventRepository, CommunicationRepository


class WebhookService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.comm_repo = CommunicationRepository(session)
        self.event_repo = CommunicationEventRepository(session)

    @staticmethod
    def _status_index(status: str) -> int:
        try:
            return STATUS_PROGRESSION.index(status)
        except ValueError:
            return -1

    async def process_event(self, communication_id: UUID, event_type: str, timestamp: datetime) -> None:
        communication = await self.comm_repo.get_by_id(communication_id)
        if not communication:
            return

        if await self.event_repo.event_exists(communication_id, event_type):
            return

        event = CommunicationEvent(
            communication_id=communication_id,
            event_type=event_type,
            timestamp=timestamp,
        )
        await self.event_repo.create(event)

        if event_type == "FAILED":
            communication.status = "FAILED"
        elif event_type in STATUS_PROGRESSION:
            current_idx = self._status_index(communication.status)
            new_idx = self._status_index(event_type)
            if new_idx > current_idx:
                communication.status = event_type
                if event_type == "SENT" and communication.sent_at is None:
                    communication.sent_at = timestamp or datetime.now(timezone.utc)

        await self.comm_repo.update(communication)
