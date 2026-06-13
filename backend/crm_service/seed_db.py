import asyncio
import random
from datetime import datetime, timedelta, timezone

from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.database import async_session_factory
from app.models.customer import Customer
from app.models.order import Order
from app.services.rfm_service import RFMService

fake = Faker('en_IN')

async def seed_data():
    async with async_session_factory() as session:
        # Clear existing
        print("Clearing existing orders and customers...")
        await session.execute(delete(Order))
        await session.execute(delete(Customer))
        await session.commit()

        print("Seeding 500 customers...")
        cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"]
        customers = []
        
        now = datetime.now(timezone.utc)
        eighteen_months_ago = now - timedelta(days=18*30)

        for _ in range(500):
            join_date = fake.date_time_between(start_date=eighteen_months_ago, end_date=now, tzinfo=timezone.utc)
            customer = Customer(
                name=fake.name(),
                email=fake.unique.email(),
                phone=fake.phone_number(),
                city=random.choice(cities),
                join_date=join_date,
                preferred_channel=random.choice(["email", "whatsapp"]),
                total_spend=0.0,
                total_orders=0,
                segment="New"  # Will be recalculated
            )
            customers.append(customer)
            session.add(customer)
            
        await session.flush()  # To get customer IDs
        
        print("Seeding 2000 orders...")
        for _ in range(2000):
            customer = random.choice(customers)
            # Order date must be between join_date and now
            order_date = fake.date_time_between(start_date=customer.join_date, end_date=now, tzinfo=timezone.utc)
            amount = round(random.uniform(500, 50000), 2)
            
            order = Order(
                customer_id=customer.id,
                amount=amount,
                product_name=fake.word().capitalize() + " Product",
                order_date=order_date
            )
            session.add(order)
            
            customer.total_orders += 1
            customer.total_spend += amount
            if not customer.last_order_date or order_date > customer.last_order_date:
                customer.last_order_date = order_date
        
        await session.commit()
        print("Data seeded successfully!")
        
        print("Running RFM recalculation...")
        rfm_service = RFMService()
        result = await rfm_service.recalculate_all(session)
        await session.commit()
        print(f"RFM Recalculation complete. Segments updated: {result['updated']}")

if __name__ == "__main__":
    asyncio.run(seed_data())
