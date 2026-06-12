import random
import time
from datetime import datetime, timezone

import httpx
import structlog

from app.config import settings
from app.simulator import DELIVERY_PROBABILITIES
from app.workers.celery_app import celery_app

logger = structlog.get_logger()


def _fire_webhook(communication_id: str, event_type: str, timestamp: datetime) -> bool:
    payload = {
        "communication_id": communication_id,
        "event_type": event_type,
        "timestamp": timestamp.isoformat(),
    }
    headers = {"X-Idempotency-Key": f"{communication_id}:{event_type}"}
    delays = [2, 4, 8]
    for attempt, delay in enumerate(delays):
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(settings.CRM_WEBHOOK_URL, json=payload, headers=headers)
                if resp.status_code in (200, 202):
                    return True
        except Exception as e:
            logger.warning("webhook_retry", attempt=attempt + 1, error=str(e))
            time.sleep(delay)
    return False


@celery_app.task(bind=True, max_retries=3, default_retry_delay=2)
def simulate_delivery(self, communication_id: str, channel: str):
    """Fire event sequence with realistic delays."""
    probs = DELIVERY_PROBABILITIES.get(channel.lower(), DELIVERY_PROBABILITIES["email"])

    _fire_webhook(communication_id, "SENT", datetime.now(timezone.utc))

    time.sleep(random.uniform(2, 5))
    if random.random() < probs["failed"]:
        _fire_webhook(communication_id, "FAILED", datetime.now(timezone.utc))
        return {"status": "failed", "communication_id": communication_id}

    _fire_webhook(communication_id, "DELIVERED", datetime.now(timezone.utc))

    time.sleep(random.uniform(5, 30))
    if random.random() < probs["opened"]:
        _fire_webhook(communication_id, "OPENED", datetime.now(timezone.utc))

        time.sleep(random.uniform(10, 60))
        if random.random() < probs["clicked"]:
            _fire_webhook(communication_id, "CLICKED", datetime.now(timezone.utc))

            time.sleep(random.uniform(30, 120))
            if random.random() < probs["converted"]:
                _fire_webhook(communication_id, "CONVERTED", datetime.now(timezone.utc))

    return {"status": "completed", "communication_id": communication_id}
