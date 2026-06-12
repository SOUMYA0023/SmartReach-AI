import httpx
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.audit import AgentRun, DecisionTimeline
from app.models.campaign import Campaign, CampaignAudience
from app.repositories.campaign_repo import (
    AgentRunRepository,
    CampaignAudienceRepository,
    CampaignRepository,
    DecisionTimelineRepository,
)
from app.repositories.customer_repo import CustomerRepository
from app.schemas.campaign import CampaignCreate
from app.security.audit_logger import AuditLogger
from app.workers.campaign_tasks import dispatch_campaign, refresh_campaign_analytics


class CampaignService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CampaignRepository(session)
        self.audience_repo = CampaignAudienceRepository(session)
        self.customer_repo = CustomerRepository(session)
        self.agent_run_repo = AgentRunRepository(session)
        self.timeline_repo = DecisionTimelineRepository(session)
        self.audit = AuditLogger()

    async def create_campaign(self, data: CampaignCreate) -> Campaign:
        campaign = Campaign(
            name=data.name,
            goal=data.goal,
            channel=data.channel,
            status="DRAFT",
            message=data.message,
            campaign_type=data.campaign_type,
            segment=data.segment,
            predicted_open_rate=data.predicted_open_rate,
            predicted_ctr=data.predicted_ctr,
            predicted_conversion=data.predicted_conversion,
            predicted_revenue=data.predicted_revenue,
        )
        campaign = await self.repo.create(campaign)

        if data.audience_filters or data.segment:
            filters = data.audience_filters or {"field": "segment", "operator": "eq", "value": data.segment}
            customers = await self.customer_repo.get_by_filters(filters)
            audiences = [
                CampaignAudience(campaign_id=campaign.id, customer_id=c.id) for c in customers
            ]
            if audiences:
                await self.audience_repo.bulk_create(audiences)
                await self.audit.log(
                    "AUDIENCE_GENERATED",
                    "campaign",
                    campaign.id,
                    {"audience_size": len(audiences), "filters": filters},
                    self.session,
                )

        if data.agent_trace:
            for trace in data.agent_trace:
                await self.agent_run_repo.create(
                    AgentRun(
                        campaign_id=campaign.id,
                        agent_name=trace.get("agent_name", "unknown"),
                        input=trace.get("input", {}),
                        output=trace.get("output", {}),
                        confidence=trace.get("confidence"),
                        execution_time_ms=trace.get("execution_time_ms"),
                    )
                )

        if data.decision_timeline:
            entries = [
                DecisionTimeline(
                    campaign_id=campaign.id,
                    step_name=step.get("step_name", "unknown"),
                    details=step.get("details", step),
                )
                for step in data.decision_timeline
            ]
            await self.timeline_repo.bulk_create(entries)

        await self.audit.log(
            "CAMPAIGN_CREATED",
            "campaign",
            campaign.id,
            {"name": campaign.name, "channel": campaign.channel},
            self.session,
        )
        return campaign

    async def list_campaigns(self, skip: int = 0, limit: int = 100) -> tuple[list[Campaign], int]:
        return await self.repo.list_all(skip=skip, limit=limit)

    async def get_campaign(self, campaign_id: UUID) -> Optional[Campaign]:
        return await self.repo.get_by_id(campaign_id)

    async def launch_campaign(self, campaign_id: UUID) -> Campaign:
        campaign = await self.repo.get_with_audience(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        if campaign.status not in ("DRAFT", "FAILED"):
            raise ValueError(f"Cannot launch campaign in status {campaign.status}")

        campaign.status = "LAUNCHING"
        await self.repo.update(campaign)
        dispatch_campaign.delay(str(campaign_id))
        refresh_campaign_analytics.apply_async(args=[str(campaign_id)], countdown=300)
        return campaign

    async def get_trace(self, campaign_id: UUID) -> dict:
        agent_runs = await self.agent_run_repo.get_by_campaign(campaign_id)
        timeline = await self.timeline_repo.get_by_campaign(campaign_id)
        return {
            "campaign_id": str(campaign_id),
            "agent_runs": [
                {
                    "agent_name": r.agent_name,
                    "input": r.input,
                    "output": r.output,
                    "confidence": r.confidence,
                    "execution_time_ms": r.execution_time_ms,
                    "created_at": r.created_at.isoformat(),
                }
                for r in agent_runs
            ],
            "decision_timeline": [
                {
                    "step_name": t.step_name,
                    "details": t.details,
                    "created_at": t.created_at.isoformat(),
                }
                for t in timeline
            ],
        }

    async def generate_via_ai(self, goal: str) -> dict[str, Any]:
        from app.services.customer_service import CustomerService

        summary = await CustomerService(self.session).get_customer_data_summary()
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.AI_SERVICE_URL}/ai/generate-campaign",
                json={"goal": goal, "customer_data_summary": summary},
            )
            response.raise_for_status()
            return response.json()
