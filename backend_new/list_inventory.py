import asyncio
from app.core.database import SessionLocal
from app.models import Product

async def main():
    async with SessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(Product))
        products = result.scalars().all()
        for p in products:
            print(f"{p.id}: {p.name}")

asyncio.run(main())
