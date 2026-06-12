from datetime import datetime
from uuid import UUID

import structlog

from app.database import async_session_factory
from app.services.webhook_service import WebhookService
from app.workers.celery_app import celery_app

logger = structlog.get_logger()


def _run_async(coro):
    import asyncio

    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=2)
def process_communication_event(self, payload: dict):
    """Process inbound communication event from channel simulator."""

    async def _process():
        async with async_session_factory() as session:
            service = WebhookService(session)
            ts = payload.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            await service.process_event(
                communication_id=UUID(payload["communication_id"]),
                event_type=payload["event_type"],
                timestamp=ts,
            )
            await session.commit()

    try:
        _run_async(_process())
    except Exception as exc:
        logger.error("webhook_process_failed", error=str(exc), payload=payload)
        raise self.retry(exc=exc)
