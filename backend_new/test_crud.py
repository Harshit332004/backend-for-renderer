import httpx
import uuid
import datetime
import asyncio

BASE_URL = "http://localhost:8000"

async def test_crud():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print("Testing Health Check...")
        r = await client.get("/")
        print("Health Check:", r.status_code, r.text)
        print("-" * 40)
        
        # 1. Inventory
        print("Testing Inventory CRUD...")
        sku = f"test-sku-{uuid.uuid4().hex[:8]}"
        prod_data = {
            "productName": "Test Product",
            "sku": sku,
            "stock": 10,
            "reorderLevel": 5,
            "price": 100,
            "wholesaleCost": 80,
            "supplier": "Test Supplier",
            "category": "Test"
        }
        try:
            r = await client.post("/agent/inventory/add", json=prod_data)
            print("Inventory Add:", r.status_code, r.text)
            product_id = ""
            if r.status_code == 200:
                product_id = r.json().get("product_id")
                
                print("Listing Inventory...")
                r2 = await client.get("/agent/inventory/status")
                print("Inventory List code:", r2.status_code)
                
                print("Editing Inventory...")
                prod_data["price"] = 150
                r3 = await client.put(f"/agent/inventory/edit/{product_id}", json=prod_data)
                print("Inventory Edit:", r3.status_code, r3.text)
                
                print("Deleting Inventory...")
                r4 = await client.delete(f"/agent/inventory/delete/{product_id}")
                print("Inventory Delete:", r4.status_code, r4.text)
        except Exception as e:
            print("Inventory CRUD Error:", e)
        print("-" * 40)
        
        # 2. Sales
        print("Testing Sales CRUD...")
        sale_data = {
            "customer": "Test Customer",
            "total": 500.0,
            "paymentMethod": "Cash",
            "items": [{"productId": "test-prod", "productName": "Test Prod", "quantity": 1, "price": 500.0}]
        }
        try:
            r = await client.post("/agent/sales/add", json=sale_data)
            print("Sale Add:", r.status_code, r.text)
            sale_id = ""
            if r.status_code == 200:
                sale_id = r.json().get("sale_id")
                
                print("Listing Sales...")
                r2 = await client.get("/agent/sales/list")
                print("Sales List code:", r2.status_code)
                
                print("Updating Sales...")
                r3 = await client.put(f"/agent/sales/{sale_id}", json={"total": 600.0})
                print("Sale Update:", r3.status_code, r3.text)
                
                print("Deleting Sales...")
                r4 = await client.delete(f"/agent/sales/{sale_id}")
                print("Sale Delete:", r4.status_code, r4.text)
        except Exception as e:
            print("Sales CRUD Error:", e)
        print("-" * 40)
        
        # 3. Purchase Orders
        print("Testing Purchase Orders CRUD...")
        order_data = {
            "supplier": "Test Supplier",
            "status": "pending",
            "total_amount": 1000.0,
            "items": [{"product_name": "Test Prod", "quantity": 10, "unit_price": 100.0}]
        }
        try:
            r = await client.post("/agent/supplier/orders/add", json=order_data)
            print("Order Add:", r.status_code, r.text)
            order_id = ""
            if r.status_code == 200:
                order_id = r.json().get("order_id")
                
                print("Listing Orders...")
                r2 = await client.get("/agent/supplier/orders")
                print("Order List code:", r2.status_code)
                
                print("Deleting Order...")
                r4 = await client.delete(f"/agent/supplier/orders/{order_id}")
                print("Order Delete:", r4.status_code, r4.text)
        except Exception as e:
            print("Orders CRUD Error:", e)
        print("-" * 40)

        # 4. Proactive Alerts
        print("Testing Proactive Alerts Listing...")
        try:
            r = await client.get("/agent/alerts")
            print("Alerts List code:", r.status_code)
        except Exception as e:
            print("Alerts Listing error: ", e)

if __name__ == "__main__":
    asyncio.run(test_crud())
