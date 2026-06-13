from celery import Celery

from app.config import settings

celery_app = Celery("channel_service", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue="channel_queue",
    imports=["app.workers.delivery_tasks"],
)

celery_app.autodiscover_tasks(["app.workers"])
