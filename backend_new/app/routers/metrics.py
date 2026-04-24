"""
app/routers/metrics.py — Professor's 10 Metrics Dashboard API endpoints.

All endpoints serve data for the analytics charts specified in the professor's
research article. Data is queried from PostgreSQL via SQLAlchemy async ORM.
"""

from collections import defaultdict
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, case, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import (
    Supplier,
    PurchaseOrder,
    CompetitorPricing,
    InventorySnapshot,
    AIResponseLog,
    ForecastError,
)

router = APIRouter()


# ─── 1. Vendor Performance by Region (Box Plot) ─────────────────────────────

@router.get("/vendor-performance-by-region")
async def vendor_performance_by_region(
    store_id: str = "store001",
    db: AsyncSession = Depends(get_db),
):
    """Group suppliers by region, return performance_score arrays per region."""
    result = await db.execute(
        select(Supplier.region, Supplier.performance_score)
        .where(Supplier.store_id == store_id)
        .where(Supplier.region.isnot(None))
        .where(Supplier.performance_score.isnot(None))
    )
    rows = result.all()
    grouped = defaultdict(list)
    for region, score in rows:
        grouped[region].append(round(float(score), 1))
    return {
        "data": [
            {"region": region, "scores": scores}
            for region, scores in sorted(grouped.items())
        ]
    }


# ─── 2. AI Procurement Impact (Box Plot) ────────────────────────────────────

@router.get("/ai-procurement-impact")
async def ai_procurement_impact(
    store_id: str = "store001",
    db: AsyncSession = Depends(get_db),
):
    """Group purchase_orders by ai_recommended, collect procurement success counts."""
    result = await db.execute(
        select(
            PurchaseOrder.ai_recommended,
            PurchaseOrder.actual_price,
        )
        .where(PurchaseOrder.store_id == store_id)
        .where(PurchaseOrder.procurement_success.is_(True))
    )
    rows = result.all()
    grouped = defaultdict(list)
    for recommended, price in rows:
        val = round(float(price), 2) if price else 0
        grouped[bool(recommended)].append(val)
    return {
        "data": [
            {"recommended": rec, "success_counts": counts}
            for rec, counts in sorted(grouped.items())
        ]
    }


# ─── 3. Cost Savings by Vendor (Bar Chart) ──────────────────────────────────

@router.get("/cost-savings-by-vendor")
async def cost_savings_by_vendor(
    store_id: str = "store001",
    db: AsyncSession = Depends(get_db),
):
    """Per vendor, compute AVG cost saving % from AI-recommended orders."""
    result = await db.execute(
        select(
            PurchaseOrder.supplier,
            func.avg(
                case(
                    (
                        and_(
                            PurchaseOrder.baseline_price.isnot(None),
                            PurchaseOrder.baseline_price > 0,
                        ),
                        (PurchaseOrder.baseline_price - PurchaseOrder.actual_price)
                        / PurchaseOrder.baseline_price
                        * 100,
                    ),
                    else_=0,
                )
            ).label("cost_saving_pct"),
        )
        .where(PurchaseOrder.store_id == store_id)
        .where(PurchaseOrder.ai_recommended.is_(True))
        .group_by(PurchaseOrder.supplier)
        .having(func.count() >= 1)
        .order_by(func.avg(
            case(
                (
                    and_(
                        PurchaseOrder.baseline_price.isnot(None),
                        PurchaseOrder.baseline_price > 0,
                    ),
                    (PurchaseOrder.baseline_price - PurchaseOrder.actual_price)
                    / PurchaseOrder.baseline_price
                    * 100,
                ),
                else_=0,
            )
        ).desc())
    )
    rows = result.all()
    return {
        "data": [
            {
                "vendor_name": row[0],
                "cost_saving_pct": round(float(row[1]), 1) if row[1] else 0,
            }
            for row in rows
        ]
    }


# ─── 4. Risk vs Compliance (Box Plot) ───────────────────────────────────────

@router.get("/risk-vs-compliance")
async def risk_vs_compliance(
    store_id: str = "store001",
    db: AsyncSession = Depends(get_db),
):
    """Group suppliers by risk_level, return compliance_score arrays."""
    result = await db.execute(
        select(Supplier.risk_level, Supplier.compliance_score)
        .where(Supplier.store_id == store_id)
        .where(Supplier.risk_level.isnot(None))
        .where(Supplier.compliance_score.isnot(None))
    )
    rows = result.all()
    grouped = defaultdict(list)
    for risk, score in rows:
        grouped[risk].append(round(float(score), 1))
    order = {"Low": 0, "Medium": 1, "High": 2}
    return {
        "data": [
            {"risk_level": rl, "compliance_scores": scores}
            for rl, scores in sorted(grouped.items(), key=lambda x: order.get(x[0], 99))
        ]
    }


# ─── 5. Competitor Pricing Trends (Line Chart) ──────────────────────────────

@router.get("/competitor-pricing-trends")
async def competitor_pricing_trends(
    product_name: Optional[str] = None,
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Pivot competitor_pricing by competitor_name for a product over N days."""
    cutoff = date.today() - timedelta(days=days)

    # Default to most common product if none specified
    if not product_name:
        sub = await db.execute(
            select(CompetitorPricing.product_name, func.count().label("cnt"))
            .group_by(CompetitorPricing.product_name)
            .order_by(func.count().desc())
            .limit(1)
        )
        row = sub.first()
        product_name = row[0] if row else "Brake Pads"

    result = await db.execute(
        select(
            CompetitorPricing.recorded_date,
            CompetitorPricing.competitor_name,
            CompetitorPricing.avg_price,
        )
        .where(CompetitorPricing.product_name == product_name)
        .where(CompetitorPricing.recorded_date >= cutoff)
        .order_by(CompetitorPricing.recorded_date)
    )
    rows = result.all()

    # Pivot: group by date, each competitor becomes a key
    date_map = defaultdict(dict)
    for rec_date, comp, price in rows:
        date_map[str(rec_date)][comp] = round(float(price), 2)

    return {
        "product_name": product_name,
        "data": [
            {"date": d, **comps} for d, comps in sorted(date_map.items())
        ],
    }


# ─── 6. Market Demand Index (Line Chart) ────────────────────────────────────

@router.get("/market-demand-index")
async def market_demand_index(
    product_name: Optional[str] = Query(default=None),
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Average demand_index from competitor_pricing grouped by date and competitor."""
    cutoff = date.today() - timedelta(days=days)
    
    # Default to most common product if none specified
    if not product_name:
        sub = await db.execute(
            select(CompetitorPricing.product_name, func.count().label("cnt"))
            .group_by(CompetitorPricing.product_name)
            .order_by(func.count().desc())
            .limit(1)
        )
        row = sub.first()
        product_name = row[0] if row else "Brake Pads"

    result = await db.execute(
        select(
            CompetitorPricing.recorded_date,
            CompetitorPricing.competitor_name,
            func.avg(CompetitorPricing.demand_index).label("avg_demand"),
        )
        .where(CompetitorPricing.product_name == product_name)
        .where(CompetitorPricing.recorded_date >= cutoff)
        .group_by(CompetitorPricing.recorded_date, CompetitorPricing.competitor_name)
        .order_by(CompetitorPricing.recorded_date)
    )
    rows = result.all()

    date_map = defaultdict(dict)
    for rec_date, comp, demand in rows:
        date_map[str(rec_date)][comp] = round(float(demand), 1)

    return {
        "data": [
            {"date": d, **comps} for d, comps in sorted(date_map.items())
        ]
    }


# ─── 7. AI Response Time (Bar + Error Bars) ─────────────────────────────────

@router.get("/ai-response-time")
async def ai_response_time(db: AsyncSession = Depends(get_db)):
    """Group by competitor_zone, compute AVG and STDDEV of response_time_minutes."""
    result = await db.execute(
        select(
            AIResponseLog.competitor_zone,
            func.avg(AIResponseLog.response_time_minutes).label("avg_rt"),
            func.stddev(AIResponseLog.response_time_minutes).label("std_rt"),
        )
        .group_by(AIResponseLog.competitor_zone)
        .order_by(AIResponseLog.competitor_zone)
    )
    rows = result.all()
    return {
        "data": [
            {
                "competitor_zone": row[0],
                "avg_response_time": round(float(row[1]), 2) if row[1] else 0,
                "std_dev": round(float(row[2]), 2) if row[2] else 0,
            }
            for row in rows
        ]
    }


# ─── 8. Actual vs Forecast (Line Chart) ─────────────────────────────────────

@router.get("/actual-vs-forecast")
async def actual_vs_forecast(
    product_name: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Return actual_demand and predicted_demand from forecast_errors table."""
    if not product_name:
        sub = await db.execute(
            select(ForecastError.product_name)
            .group_by(ForecastError.product_name)
            .order_by(func.count().desc())
            .limit(1)
        )
        row = sub.first()
        product_name = row[0] if row else "Brake Pads"

    result = await db.execute(
        select(
            ForecastError.forecast_date,
            ForecastError.actual_demand,
            ForecastError.predicted_demand,
        )
        .where(ForecastError.product_name == product_name)
        .order_by(ForecastError.forecast_date)
    )
    rows = result.all()
    return {
        "product_name": product_name,
        "data": [
            {
                "date": str(row[0]),
                "actual": round(float(row[1]), 1),
                "predicted": round(float(row[2]), 1),
            }
            for row in rows
        ],
    }


# ─── 9. Inventory Level Over Time (Area Chart) ──────────────────────────────

@router.get("/inventory-level-over-time")
async def inventory_level_over_time(
    product_name: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Select from inventory_snapshots for a given product, ordered by date."""
    if not product_name:
        sub = await db.execute(
            select(InventorySnapshot.product_name)
            .group_by(InventorySnapshot.product_name)
            .order_by(func.count().desc())
            .limit(1)
        )
        row = sub.first()
        product_name = row[0] if row else "Brake Pads"

    result = await db.execute(
        select(InventorySnapshot.snapshot_date, InventorySnapshot.stock_level)
        .where(InventorySnapshot.product_name == product_name)
        .order_by(InventorySnapshot.snapshot_date)
    )
    rows = result.all()
    return {
        "product_name": product_name,
        "data": [
            {"date": str(row[0]), "stock_level": int(row[1])}
            for row in rows
        ],
    }


# ─── 10. Forecast Error Distribution (Box Plot) ─────────────────────────────

@router.get("/forecast-error-distribution")
async def forecast_error_distribution(db: AsyncSession = Depends(get_db)):
    """Group forecast_errors by product_name, return all error values as arrays."""
    result = await db.execute(
        select(ForecastError.product_name, ForecastError.forecast_error)
        .where(ForecastError.forecast_error.isnot(None))
        .order_by(ForecastError.product_name)
    )
    rows = result.all()
    grouped = defaultdict(list)
    for name, error in rows:
        grouped[name].append(round(float(error), 1))
    return {
        "data": [
            {"product_name": name, "errors": errors}
            for name, errors in sorted(grouped.items())
        ]
    }


# ─── 11. Available Products (for dropdowns) ─────────────────────────────────

@router.get("/available-products")
async def available_products(db: AsyncSession = Depends(get_db)):
    """Return combined list of product names from inventory_snapshots and forecast_errors."""
    r1 = await db.execute(select(distinct(InventorySnapshot.product_name)))
    r2 = await db.execute(select(distinct(ForecastError.product_name)))
    names = set()
    for row in r1.all():
        names.add(row[0])
    for row in r2.all():
        names.add(row[0])
    return {"products": sorted(names)}
