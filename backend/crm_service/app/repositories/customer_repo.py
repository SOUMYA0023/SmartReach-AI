from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.order import Order
from app.repositories.base import BaseRepository, QueryBuilder


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Customer)

    async def get_by_email(self, email: str) -> Optional[Customer]:
        result = await self.session.execute(select(Customer).where(Customer.email == email))
        return result.scalar_one_or_none()

    async def get_with_orders(self, id: UUID) -> Optional[Customer]:
        result = await self.session.execute(
            select(Customer).options(selectinload(Customer.orders)).where(Customer.id == id)
        )
        return result.scalar_one_or_none()

    async def list_filtered(
        self,
        skip: int = 0,
        limit: int = 100,
        segment: Optional[str] = None,
        city: Optional[str] = None,
    ) -> tuple[list[Customer], int]:
        stmt = select(Customer)
        count_stmt = select(func.count()).select_from(Customer)
        if segment:
            stmt = stmt.where(Customer.segment == segment)
            count_stmt = count_stmt.where(Customer.segment == segment)
        if city:
            stmt = stmt.where(Customer.city == city)
            count_stmt = count_stmt.where(Customer.city == city)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(stmt.offset(skip).limit(limit))
        return list(result.scalars().all()), total

    async def get_by_filters(self, filters: dict[str, Any] | list[dict[str, Any]], limit: int = 10000) -> list[Customer]:
        stmt = QueryBuilder.build_query(Customer, filters).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_customers(self) -> list[Customer]:
        result = await self.session.execute(select(Customer))
        return list(result.scalars().all())

    async def segment_distribution(self) -> dict[str, int]:
        result = await self.session.execute(
            select(Customer.segment, func.count()).group_by(Customer.segment)
        )
        return {seg or "Unknown": count for seg, count in result.all()}


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Order)

    async def get_by_customer(self, customer_id: UUID) -> list[Order]:
        result = await self.session.execute(
            select(Order).where(Order.customer_id == customer_id).order_by(Order.order_date.desc())
        )
        return list(result.scalars().all())
