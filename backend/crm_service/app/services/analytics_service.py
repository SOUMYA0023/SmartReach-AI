from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.campaign_repo import CampaignAudienceRepository, CampaignRepository
from app.repositories.communication_repo import CommunicationRepository
from app.repositories.customer_repo import CustomerRepository


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.campaign_repo = CampaignRepository(session)
        self.audience_repo = CampaignAudienceRepository(session)
        self.comm_repo = CommunicationRepository(session)
        self.customer_repo = CustomerRepository(session)

    async def get_campaign_analytics(self, campaign_id: UUID) -> dict:
        campaign = await self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")

        audience_size = await self.audience_repo.count_by_campaign(campaign_id)
        status_counts = await self.comm_repo.status_counts(campaign_id)

        sent = status_counts.get("SENT", 0) + status_counts.get("DELIVERED", 0) + status_counts.get(
            "OPENED", 0
        ) + status_counts.get("CLICKED", 0) + status_counts.get("CONVERTED", 0)
        delivered = status_counts.get("DELIVERED", 0) + status_counts.get("OPENED", 0) + status_counts.get(
            "CLICKED", 0
        ) + status_counts.get("CONVERTED", 0)
        opened = status_counts.get("OPENED", 0) + status_counts.get("CLICKED", 0) + status_counts.get(
            "CONVERTED", 0
        )
        clicked = status_counts.get("CLICKED", 0) + status_counts.get("CONVERTED", 0)
        converted = status_counts.get("CONVERTED", 0)
        failed = status_counts.get("FAILED", 0)

        delivery_rate = delivered / sent if sent > 0 else 0.0
        open_rate = opened / delivered if delivered > 0 else 0.0
        ctr = clicked / opened if opened > 0 else 0.0
        conversion_rate = converted / clicked if clicked > 0 else 0.0

        return {
            "campaign_id": str(campaign_id),
            "audience_size": audience_size,
            "sent": sent,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "converted": converted,
            "failed": failed,
            "delivery_rate": round(delivery_rate, 4),
            "open_rate": round(open_rate, 4),
            "ctr": round(ctr, 4),
            "conversion_rate": round(conversion_rate, 4),
            "predicted_vs_actual": {
                "open_rate": {
                    "predicted": campaign.predicted_open_rate,
                    "actual": round(open_rate * 100, 2) if delivered > 0 else 0.0,
                },
                "ctr": {
                    "predicted": campaign.predicted_ctr,
                    "actual": round(ctr * 100, 2) if opened > 0 else 0.0,
                },
                "conversion": {
                    "predicted": campaign.predicted_conversion,
                    "actual": round(conversion_rate * 100, 2) if clicked > 0 else 0.0,
                },
            },
        }

    async def get_dashboard(self) -> dict:
        total_customers = await self.customer_repo.count()
        total_campaigns = await self.campaign_repo.count()
        segment_distribution = await self.customer_repo.segment_distribution()

        campaigns, _ = await self.campaign_repo.list_all(limit=1000)
        total_sent = 0
        total_delivered = 0
        total_opened = 0
        total_clicked = 0
        total_converted = 0
        channel_performance: dict[str, dict[str, int]] = {}

        for campaign in campaigns:
            status_counts = await self.comm_repo.status_counts(campaign.id)
            sent = status_counts.get("SENT", 0) + status_counts.get("DELIVERED", 0) + status_counts.get(
                "OPENED", 0
            ) + status_counts.get("CLICKED", 0) + status_counts.get("CONVERTED", 0)
            delivered = status_counts.get("DELIVERED", 0) + status_counts.get("OPENED", 0) + status_counts.get(
                "CLICKED", 0
            ) + status_counts.get("CONVERTED", 0)
            opened = status_counts.get("OPENED", 0) + status_counts.get("CLICKED", 0) + status_counts.get(
                "CONVERTED", 0
            )
            clicked = status_counts.get("CLICKED", 0) + status_counts.get("CONVERTED", 0)
            converted = status_counts.get("CONVERTED", 0)

            total_sent += sent
            total_delivered += delivered
            total_opened += opened
            total_clicked += clicked
            total_converted += converted

            if campaign.channel not in channel_performance:
                channel_performance[campaign.channel] = {"opened": 0, "delivered": 0}
            channel_performance[campaign.channel]["opened"] += opened
            channel_performance[campaign.channel]["delivered"] += delivered

        avg_open_rate = total_opened / total_delivered if total_delivered > 0 else 0.0
        top_channel = "email"
        best_rate = 0.0
        for channel, stats in channel_performance.items():
            rate = stats["opened"] / stats["delivered"] if stats["delivered"] > 0 else 0
            if rate > best_rate:
                best_rate = rate
                top_channel = channel

        return {
            "total_customers": total_customers,
            "total_campaigns": total_campaigns,
            "avg_open_rate": round(avg_open_rate, 4),
            "total_converted": total_converted,
            "top_performing_channel": top_channel,
            "segment_distribution": segment_distribution,
            "total_sent": total_sent,
            "total_delivered": total_delivered,
            "total_opened": total_opened,
            "total_clicked": total_clicked,
        }
