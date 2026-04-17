import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text
from app.models import Base

async def main():
    async with AsyncSessionLocal() as db:
        # Get all table names
        tables = [
            "inventory", "customer_sales", "sale_items", "purchase_orders", 
            "order_items", "suppliers", "demand_forecast", "proactive_alerts",
            "competitor_prices"
        ]
        
        for table in tables:
            result = await db.execute(text(f"SELECT * FROM {table}"))
            rows = result.mappings().all()
            for row in rows:
                row_str = str(dict(row)).lower()
                if "nanesh" in row_str or "chadi" in row_str:
                    print(f"FOUND IN {table}: {row_str}")
                    # Delete the row
                    if "id" in row:
                        await db.execute(text(f"DELETE FROM {table} WHERE id = '{row['id']}'"))
                        print("Deleted it")
        await db.commit()
        print("Done check pg")

if __name__ == "__main__":
    asyncio.run(main())
