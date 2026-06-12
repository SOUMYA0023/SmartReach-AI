import csv
import io
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.order import Order
from app.repositories.customer_repo import CustomerRepository, OrderRepository
from app.services.rfm_service import RFMService


class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CustomerRepository(session)
        self.order_repo = OrderRepository(session)
        self.rfm = RFMService()

    async def upload_csv(self, file_content: bytes) -> dict:
        created = 0
        updated = 0
        errors: list[str] = []
        reader = csv.DictReader(io.StringIO(file_content.decode("utf-8")))
        all_customers = await self.repo.get_all_customers()

        for i, row in enumerate(reader, start=2):
            try:
                email = row.get("email", "").strip()
                if not email:
                    errors.append(f"Row {i}: missing email")
                    continue
                existing = await self.repo.get_by_email(email)
                join_date = datetime.fromisoformat(row.get("join_date", datetime.utcnow().isoformat()))
                last_order = row.get("last_order_date")
                last_order_date = datetime.fromisoformat(last_order) if last_order else None

                if existing:
                    existing.name = row.get("name", existing.name)
                    existing.phone = row.get("phone") or existing.phone
                    existing.city = row.get("city") or existing.city
                    existing.join_date = join_date
                    existing.last_order_date = last_order_date
                    existing.total_spend = float(row.get("total_spend", existing.total_spend))
                    existing.total_orders = int(row.get("total_orders", existing.total_orders))
                    existing.preferred_channel = row.get("preferred_channel") or existing.preferred_channel
                    await self.repo.update(existing)
                    updated += 1
                else:
                    customer = Customer(
                        name=row.get("name", "Unknown"),
                        email=email,
                        phone=row.get("phone"),
                        city=row.get("city"),
                        join_date=join_date,
                        last_order_date=last_order_date,
                        total_spend=float(row.get("total_spend", 0)),
                        total_orders=int(row.get("total_orders", 0)),
                        preferred_channel=row.get("preferred_channel"),
                    )
                    await self.repo.create(customer)
                    all_customers.append(customer)
                    created += 1
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

        all_customers = await self.repo.get_all_customers()
        for customer in all_customers:
            customer.segment = await self.rfm.assign_segment(customer, all_customers)
        await self.session.flush()
        return {"created": created, "updated": updated, "errors": errors}

    async def list_customers(
        self, skip: int = 0, limit: int = 100, segment: Optional[str] = None, city: Optional[str] = None
    ) -> tuple[list[Customer], int]:
        return await self.repo.list_filtered(skip=skip, limit=limit, segment=segment, city=city)

    async def get_customer(self, customer_id: UUID) -> Optional[Customer]:
        return await self.repo.get_with_orders(customer_id)

    async def get_customer_data_summary(self) -> dict:
        all_customers = await self.repo.get_all_customers()
        segments = await self.repo.segment_distribution()
        return {
            "total_customers": len(all_customers),
            "segment_distribution": segments,
            "avg_spend": sum(c.total_spend for c in all_customers) / max(len(all_customers), 1),
            "avg_orders": sum(c.total_orders for c in all_customers) / max(len(all_customers), 1),
        }

    async def upload_orders_csv(self, file_content: bytes) -> dict:
        created = 0
        errors: list[str] = []
        reader = csv.DictReader(io.StringIO(file_content.decode("utf-8")))

        for i, row in enumerate(reader, start=2):
            try:
                email = row.get("customer_email", "").strip()
                customer = await self.repo.get_by_email(email)
                if not customer:
                    errors.append(f"Row {i}: customer not found for {email}")
                    continue
                order = Order(
                    customer_id=customer.id,
                    amount=float(row.get("amount", 0)),
                    product_name=row.get("product_name", "Unknown"),
                    order_date=datetime.fromisoformat(row.get("order_date", datetime.utcnow().isoformat())),
                )
                await self.order_repo.create(order)
                customer.total_orders += 1
                customer.total_spend += order.amount
                if customer.last_order_date is None or order.order_date > customer.last_order_date:
                    customer.last_order_date = order.order_date
                created += 1
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

        all_customers = await self.repo.get_all_customers()
        for customer in all_customers:
            customer.segment = await self.rfm.assign_segment(customer, all_customers)
        await self.session.flush()
        return {"created": created, "errors": errors}
