import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.schemas.communication import CommunicationEventPayload, WebhookAcceptedResponse
from app.workers.webhook_tasks import process_communication_event

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

IDEMPOTENCY_TTL = 86400  # 24 hours


async def get_redis():
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()


@router.post("/communication-event", response_model=WebhookAcceptedResponse, status_code=202)
async def communication_event(
    payload: CommunicationEventPayload,
    redis_client: aioredis.Redis = Depends(get_redis),
    session: AsyncSession = Depends(get_session),
):
    """
    Receive channel simulator callbacks.
    Returns 202 immediately after idempotency check and task enqueue.
    """
    idempotency_key = f"webhook:{payload.communication_id}:{payload.event_type}"
    existing = await redis_client.get(idempotency_key)
    if existing:
        return WebhookAcceptedResponse(status="duplicate", message="Event already processed")

    await redis_client.setex(idempotency_key, IDEMPOTENCY_TTL, "1")
    process_communication_event.delay(
        {
            "communication_id": str(payload.communication_id),
            "event_type": payload.event_type,
            "timestamp": payload.timestamp.isoformat(),
        }
    )
    return WebhookAcceptedResponse(status="accepted", message="Event queued for processing")
