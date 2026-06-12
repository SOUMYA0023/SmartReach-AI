from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery("crm_service", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "refresh-rfm-segments": {
            "task": "app.workers.campaign_tasks.refresh_rfm_segments",
            "schedule": crontab(minute=0, hour="*/6"),
        },
    },
)

celery_app.autodiscover_tasks(["app.workers"])
