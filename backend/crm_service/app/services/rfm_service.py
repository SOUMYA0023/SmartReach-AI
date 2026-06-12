from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.repositories.customer_repo import CustomerRepository


class RFMService:
    """
    Recency: days since last_order_date
      0–30 days → R=5, 31–60 → R=4, 61–120 → R=3, 121–180 → R=2, 180+ → R=1

    Frequency: total_orders
      10+ → F=5, 7–9 → F=4, 4–6 → F=3, 2–3 → F=2, 1 → F=1

    Monetary: total_spend
      Top 20% → M=5, 21–40% → M=4, 41–60% → M=3, 61–80% → M=2, Bottom 20% → M=1

    Segment assignment:
      R≥4 AND F≥4 AND M≥4 → VIP
      R≥3 AND F≥3 → Loyal
      R≥3 AND F≤2 → Potential Loyalist
      R=2 AND F≥2 → At Risk
      R=1 → Dormant
      join_date within 30 days → New (override)
    """

    async def calculate_recency(self, customer: Customer) -> int:
        now = datetime.now(timezone.utc)
        if customer.last_order_date is None:
            return 1
        last = customer.last_order_date
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        days = (now - last).days
        if days <= 30:
            return 5
        if days <= 60:
            return 4
        if days <= 120:
            return 3
        if days <= 180:
            return 2
        return 1

    async def calculate_frequency(self, customer: Customer) -> int:
        orders = customer.total_orders
        if orders >= 10:
            return 5
        if orders >= 7:
            return 4
        if orders >= 4:
            return 3
        if orders >= 2:
            return 2
        return 1

    async def calculate_monetary(self, customer: Customer, all_customers: list[Customer]) -> int:
        if not all_customers:
            return 3
        spends = sorted([c.total_spend for c in all_customers], reverse=True)
        n = len(spends)
        if n == 1:
            return 5
        rank = spends.index(customer.total_spend)
        percentile = (rank + 1) / n
        if percentile <= 0.2:
            return 5
        if percentile <= 0.4:
            return 4
        if percentile <= 0.6:
            return 3
        if percentile <= 0.8:
            return 2
        return 1

    async def assign_segment(self, customer: Customer, all_customers: list[Customer]) -> str:
        now = datetime.now(timezone.utc)
        join = customer.join_date
        if join.tzinfo is None:
            join = join.replace(tzinfo=timezone.utc)
        if (now - join).days <= 30:
            return "New"

        r = await self.calculate_recency(customer)
        f = await self.calculate_frequency(customer)
        m = await self.calculate_monetary(customer, all_customers)

        if r >= 4 and f >= 4 and m >= 4:
            return "VIP"
        if r >= 3 and f >= 3:
            return "Loyal"
        if r >= 3 and f <= 2:
            return "Potential Loyalist"
        if r == 2 and f >= 2:
            return "At Risk"
        if r == 1:
            return "Dormant"
        return "Potential Loyalist"

    async def recalculate_all(self, session: AsyncSession) -> dict:
        repo = CustomerRepository(session)
        customers = await repo.get_all_customers()
        updated = 0
        segments: dict[str, int] = {}
        for customer in customers:
            segment = await self.assign_segment(customer, customers)
            customer.segment = segment
            segments[segment] = segments.get(segment, 0) + 1
            updated += 1
        await session.flush()
        return {"updated": updated, "segments": segments}
