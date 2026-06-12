from datetime import datetime, timedelta, timezone

import pytest

from app.models.customer import Customer
from app.services.rfm_service import RFMService


_counter = 0


def _customer(
    total_orders: int = 1,
    total_spend: float = 100.0,
    days_since_order: int = 10,
    days_since_join: int = 100,
) -> Customer:
    global _counter
    _counter += 1
    now = datetime.now(timezone.utc)
    return Customer(
        name="Test",
        email=f"test{_counter}@example.com",
        join_date=now - timedelta(days=days_since_join),
        last_order_date=now - timedelta(days=days_since_order),
        total_spend=total_spend,
        total_orders=total_orders,
    )


@pytest.mark.asyncio
async def test_segment_vip():
    service = RFMService()
    vip_customer = _customer(total_orders=10, total_spend=5000, days_since_order=5)
    # Enough low-spend customers so top spender lands in top 20% monetary tier
    low_spenders = [
        _customer(total_orders=1, total_spend=100, days_since_order=200)
        for _ in range(8)
    ]
    customers = [vip_customer] + low_spenders
    segment = await service.assign_segment(vip_customer, customers)
    assert segment == "VIP"


@pytest.mark.asyncio
async def test_segment_loyal():
    service = RFMService()
    customers = [
        _customer(total_orders=5, total_spend=2000, days_since_order=20),
        _customer(total_orders=1, total_spend=50, days_since_order=200),
    ]
    segment = await service.assign_segment(customers[0], customers)
    assert segment == "Loyal"


@pytest.mark.asyncio
async def test_segment_potential_loyalist():
    service = RFMService()
    customers = [
        _customer(total_orders=2, total_spend=300, days_since_order=45),
        _customer(total_orders=10, total_spend=5000, days_since_order=5),
    ]
    segment = await service.assign_segment(customers[0], customers)
    assert segment == "Potential Loyalist"


@pytest.mark.asyncio
async def test_segment_at_risk():
    service = RFMService()
    customers = [
        _customer(total_orders=3, total_spend=800, days_since_order=150),
        _customer(total_orders=1, total_spend=100, days_since_order=5),
    ]
    segment = await service.assign_segment(customers[0], customers)
    assert segment == "At Risk"


@pytest.mark.asyncio
async def test_segment_dormant():
    service = RFMService()
    customers = [
        _customer(total_orders=2, total_spend=500, days_since_order=200),
        _customer(total_orders=10, total_spend=5000, days_since_order=5),
    ]
    segment = await service.assign_segment(customers[0], customers)
    assert segment == "Dormant"


@pytest.mark.asyncio
async def test_segment_new_override():
    service = RFMService()
    customers = [
        _customer(total_orders=10, total_spend=5000, days_since_order=5, days_since_join=10),
    ]
    segment = await service.assign_segment(customers[0], customers)
    assert segment == "New"
