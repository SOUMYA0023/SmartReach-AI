from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditLogger:
    async def log(
        self,
        action: str,
        entity_type: str,
        entity_id: Optional[UUID],
        metadata: dict,
        session: AsyncSession,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_=metadata,
        )
        session.add(entry)
        await session.flush()
        return entry
