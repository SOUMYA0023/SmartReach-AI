from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.campaign import Campaign, CampaignAudience
from app.models.communication import Communication
from app.models.customer import Customer


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_create_and_launch_campaign_flow(mock_session):
    campaign_id = uuid4()
    customer_id = uuid4()

    campaign = Campaign(
        id=campaign_id,
        name="Win-back Campaign",
        goal="Bring back dormant customers",
        channel="whatsapp",
        status="DRAFT",
        message="We miss you! Come back for 15% off.",
        segment="Dormant",
        predicted_open_rate=45.0,
        predicted_ctr=12.0,
        predicted_conversion=2.4,
        predicted_revenue=9600.0,
        created_at=datetime.now(timezone.utc),
    )
    customer = Customer(
        id=customer_id,
        name="Jane Doe",
        email="jane@example.com",
        phone="+919876543210",
        join_date=datetime.now(timezone.utc),
        total_spend=5000,
        total_orders=8,
        segment="Dormant",
    )
    audience = CampaignAudience(campaign_id=campaign_id, customer_id=customer_id, id=uuid4())

    async def override_get_session():
        yield mock_session

    with patch("app.api.campaigns.CampaignService") as MockCampaignService:
        service_instance = MockCampaignService.return_value
        service_instance.create_campaign = AsyncMock(return_value=campaign)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post(
                "/campaigns",
                json={
                    "name": "Win-back Campaign",
                    "goal": "Bring back dormant customers",
                    "channel": "whatsapp",
                    "message": "We miss you! Come back for 15% off.",
                    "segment": "Dormant",
                },
            )

        assert create_resp.status_code == 200
        assert create_resp.json()["status"] == "DRAFT"


@pytest.mark.asyncio
async def test_webhook_updates_communication_status():
    from app.services.webhook_service import WebhookService

    comm_id = uuid4()
    communication = Communication(
        id=comm_id,
        campaign_id=uuid4(),
        customer_id=uuid4(),
        channel="whatsapp",
        message="Test",
        status="SENT",
    )

    mock_comm_repo = AsyncMock()
    mock_comm_repo.get_by_id = AsyncMock(return_value=communication)
    mock_comm_repo.update = AsyncMock()

    mock_event_repo = AsyncMock()
    mock_event_repo.event_exists = AsyncMock(return_value=False)
    mock_event_repo.create = AsyncMock()

    session = AsyncMock()
    service = WebhookService(session)
    service.comm_repo = mock_comm_repo
    service.event_repo = mock_event_repo

    await service.process_event(comm_id, "DELIVERED", datetime.now(timezone.utc))
    assert communication.status == "DELIVERED"

    await service.process_event(comm_id, "OPENED", datetime.now(timezone.utc))
    assert communication.status == "OPENED"


@pytest.mark.asyncio
async def test_status_regression_rejected():
    from app.services.webhook_service import WebhookService

    comm_id = uuid4()
    communication = Communication(
        id=comm_id,
        campaign_id=uuid4(),
        customer_id=uuid4(),
        channel="email",
        message="Test",
        status="OPENED",
    )

    mock_comm_repo = AsyncMock()
    mock_comm_repo.get_by_id = AsyncMock(return_value=communication)
    mock_comm_repo.update = AsyncMock()

    mock_event_repo = AsyncMock()
    mock_event_repo.event_exists = AsyncMock(return_value=False)
    mock_event_repo.create = AsyncMock()

    service = WebhookService(AsyncMock())
    service.comm_repo = mock_comm_repo
    service.event_repo = mock_event_repo

    await service.process_event(comm_id, "DELIVERED", datetime.now(timezone.utc))
    assert communication.status == "OPENED"
