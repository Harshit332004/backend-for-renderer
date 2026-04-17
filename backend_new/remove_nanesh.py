import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models import Inventory, Supplier, PurchaseOrder, CustomerSale, OrderItem, SaleItem

async def main():
    async with AsyncSessionLocal() as db:
        # Check Inventory
        result = await db.execute(select(Inventory))
        items = result.scalars().all()
        for item in items:
            if item.product_name and "nanesh" in item.product_name.lower():
                print(f"Found in Inventory: {item.product_name}")
                await db.delete(item)
                
        # Check Supplier
        result = await db.execute(select(Supplier))
        items = result.scalars().all()
        for item in items:
            if item.supplier_name and "nanesh" in item.supplier_name.lower():
                print(f"Found in Supplier: {item.supplier_name}")
                await db.delete(item)
                
        await db.commit()
        print("Done deleting nanesh from Postgres DB")

if __name__ == "__main__":
    asyncio.run(main())
