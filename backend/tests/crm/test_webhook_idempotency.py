from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.webhooks import get_redis
from app.main import app


@pytest.mark.asyncio
async def test_duplicate_webhook_returns_duplicate_status():
    comm_id = uuid4()
    payload = {
        "communication_id": str(comm_id),
        "event_type": "DELIVERED",
        "timestamp": "2026-06-12T10:00:00+00:00",
    }

    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value="1")
    mock_redis.setex = AsyncMock()
    mock_redis.aclose = AsyncMock()

    async def mock_get_redis():
        yield mock_redis

    app.dependency_overrides[get_redis] = mock_get_redis
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/webhooks/communication-event", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json()["status"] == "duplicate"
    mock_redis.setex.assert_not_called()


@pytest.mark.asyncio
async def test_new_webhook_sets_idempotency_key():
    comm_id = uuid4()
    payload = {
        "communication_id": str(comm_id),
        "event_type": "DELIVERED",
        "timestamp": "2026-06-12T10:00:00+00:00",
    }

    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.setex = AsyncMock()
    mock_redis.aclose = AsyncMock()

    async def mock_get_redis():
        yield mock_redis

    app.dependency_overrides[get_redis] = mock_get_redis
    with patch("app.api.webhooks.process_communication_event") as mock_task:
        mock_task.delay = MagicMock()
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/webhooks/communication-event", json=payload)
        finally:
            app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json()["status"] == "accepted"
    mock_redis.setex.assert_called_once_with(f"webhook:{comm_id}:DELIVERED", 86400, "1")
    mock_task.delay.assert_called_once()
