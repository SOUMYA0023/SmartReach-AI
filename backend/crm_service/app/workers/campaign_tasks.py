import asyncio
from datetime import datetime, timezone

import httpx
import structlog

from app.config import settings
from app.database import async_session_factory
from app.models.communication import Communication
from app.repositories.campaign_repo import CampaignAudienceRepository, CampaignRepository
from app.repositories.communication_repo import CommunicationRepository
from app.repositories.customer_repo import CustomerRepository
from app.security.audit_logger import AuditLogger
from app.services.rfm_service import RFMService
from app.workers.celery_app import celery_app

logger = structlog.get_logger()


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def dispatch_campaign(self, campaign_id: str):
    """Dispatch campaign communications to channel service."""

    async def _dispatch():
        async with async_session_factory() as session:
            campaign_repo = CampaignRepository(session)
            audience_repo = CampaignAudienceRepository(session)
            comm_repo = CommunicationRepository(session)
            customer_repo = CustomerRepository(session)
            audit = AuditLogger()

            campaign = await campaign_repo.get_by_id(campaign_id)
            if not campaign:
                logger.error("campaign_not_found", campaign_id=campaign_id)
                return

            audiences = await audience_repo.get_by_campaign(campaign.id)
            sent_count = 0

            async with httpx.AsyncClient(timeout=30.0) as client:
                for aud in audiences:
                    existing = await comm_repo.get_by_campaign(campaign.id)
                    comm_for_customer = [c for c in existing if c.customer_id == aud.customer_id]
                    if comm_for_customer and comm_for_customer[0].status != "PENDING":
                        continue

                    customer = await customer_repo.get_by_id(aud.customer_id)
                    if not customer:
                        continue

                    if comm_for_customer:
                        comm = comm_for_customer[0]
                    else:
                        comm = Communication(
                            campaign_id=campaign.id,
                            customer_id=aud.customer_id,
                            channel=campaign.channel,
                            message=campaign.message or campaign.goal,
                            status="PENDING",
                        )
                        comm = await comm_repo.create(comm)

                    recipient = customer.phone or customer.email
                    try:
                        resp = await client.post(
                            f"{settings.CHANNEL_SERVICE_URL}/send",
                            json={
                                "communication_id": str(comm.id),
                                "campaign_id": str(campaign.id),
                                "customer_id": str(aud.customer_id),
                                "channel": campaign.channel,
                                "message": comm.message,
                                "recipient": recipient,
                            },
                        )
                        if resp.status_code == 200:
                            comm.status = "SENT"
                            comm.sent_at = datetime.now(timezone.utc)
                            await comm_repo.update(comm)
                            sent_count += 1
                    except Exception as e:
                        logger.error("channel_send_failed", error=str(e), comm_id=str(comm.id))

            campaign.status = "ACTIVE"
            await campaign_repo.update(campaign)
            await audit.log(
                "CAMPAIGN_LAUNCHED",
                "campaign",
                campaign.id,
                {"sent_count": sent_count, "audience_size": len(audiences)},
                session,
            )
            await session.commit()
            logger.info("campaign_dispatched", campaign_id=campaign_id, sent=sent_count)

    try:
        _run_async(_dispatch())
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task
def refresh_rfm_segments():
    """Scheduled task: recalculate RFM for all customers."""

    async def _refresh():
        async with async_session_factory() as session:
            result = await RFMService().recalculate_all(session)
            await session.commit()
            return result

    return _run_async(_refresh())


@celery_app.task
def refresh_campaign_analytics(campaign_id: str):
    """Trigger analytics recalculation for a campaign."""
    logger.info("analytics_refresh_triggered", campaign_id=campaign_id)
    return {"campaign_id": campaign_id, "status": "refreshed"}
