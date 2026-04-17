"""
app/agents/cashflow_agent.py -- Financial tracking and forecasting agent.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import CustomerSale, PurchaseOrder
from app.agents.inventory_agent import check_low_stock
from app.agents.supplier_agent import discover_suppliers, compare_prices

async def cashflow_agent(db: AsyncSession, store_id: str = "store001") -> dict:
    """
    Computes cash balance from PostgreSQL revenue/expenses and projects 
    post-procurement liquidity by checking low stock against live supplier prices.
    """
    # ── 1. Calculate Current Cash Balance (Harshit's Logic) ───────────────────
    # Inflow: revenue from sales
    inflow_result = await db.execute(
        select(func.coalesce(func.sum(CustomerSale.total), 0.0))
        .where(CustomerSale.store_id == store_id)
    )
    inflow = float(inflow_result.scalar() or 0.0)

    # Outflow: cost of purchase orders
    outflow_result = await db.execute(
        select(func.coalesce(func.sum(PurchaseOrder.total_amount), 0.0))
        .where(PurchaseOrder.store_id == store_id)
    )
    outflow = float(outflow_result.scalar() or 0.0)

    balance = inflow - outflow

    # ── 2. Procurement Cost Estimate (Mehul's Logic) ──────────────────────────
    # Handling potential sync/async differences in the underlying functions safely
    try:
        low_stock_items = await check_low_stock(db, store_id=store_id)
    except TypeError:
        low_stock_items = check_low_stock(store_id=store_id)

    estimated_procurement_cost = 0.0
    pending_reorders = []

    for item in low_stock_items:
        product_id = item.get("product_id") or item.get("id")
        product_name = item.get("product_name", item.get("productName", item.get("name", product_id)))
        
        reorder_suggestion = item.get("reorder_suggestion", {})
        qty = float(reorder_suggestion.get("recommendedReorderQty", 0))
        
        if qty > 0:
            try:
                suppliers = await discover_suppliers(db, store_id, product_name)
                ranked = compare_prices(suppliers)
            except TypeError:
                suppliers = await discover_suppliers(db, store_id, product_name)
                ranked = compare_prices(suppliers)
            
            if ranked:
                best_supplier = ranked[0]
                price_per_unit = float(best_supplier.get("price_per_unit", 0))
                cost = qty * price_per_unit
                supplier_name = best_supplier.get("supplierName", "Unknown Supplier")
            else:
                base_price = float(item.get("price", 0))
                wholesale_cost = float(item.get("wholesaleCost", base_price * 0.6))
                cost = qty * wholesale_cost
                supplier_name = "Internal Estimate (No Supplier Found)"
            
            estimated_procurement_cost += cost
            pending_reorders.append({
                "product_id": product_id,
                "product_name": product_name,
                "quantity": qty,
                "estimated_cost": round(cost, 2),
                "supplier": supplier_name
            })

    post_procurement_balance = balance - estimated_procurement_cost

    return {
        "vendorId": store_id,
        "storeId": store_id,
        "inflow": round(inflow, 2),
        "outflow": round(outflow, 2),
        "balance": round(balance, 2),
        "estimatedProcurementCost": round(estimated_procurement_cost, 2),
        "postProcurementBalance": round(post_procurement_balance, 2),
        "pendingReorders": pending_reorders
    }