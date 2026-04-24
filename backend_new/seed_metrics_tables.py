"""
seed_metrics_tables.py — Create and seed all tables needed for the Professor's 10 Metrics Dashboard.

Usage:
    cd backend_new
    python seed_metrics_tables.py

Connects via SYNC_DATABASE_URL (psycopg2) from .env.
"""

import os, random, math
from datetime import datetime, timedelta, date
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

load_dotenv(Path(__file__).resolve().parent / ".env")
_raw = os.environ["SYNC_DATABASE_URL"]
# Strip SQLAlchemy driver prefix and query params psycopg2 doesn't understand
DATABASE_URL = _raw.replace("postgresql+psycopg2://", "postgresql://")
# Remove prepared_statement_cache_size param (only for asyncpg)
if "?" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?")[0]


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def run():
    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor()

    print("=" * 60)
    print("[*] Seeding Professor's Metrics Tables")
    print("=" * 60)

    # ── 1A. ALTER suppliers ──────────────────────────────────────
    print("\n[1/6] Altering suppliers table...")
    for col_sql in [
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Central'",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Medium'",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS compliance_score FLOAT DEFAULT 80.0",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS performance_score FLOAT DEFAULT 75.0",
    ]:
        cur.execute(col_sql)

    cur.execute("""
        UPDATE suppliers SET
            region = (ARRAY['West','East','North','South','Central'])[floor(random()*5+1)::int],
            risk_level = (ARRAY['Low','Medium','High'])[floor(random()*3+1)::int],
            compliance_score = round((70 + random()*29)::numeric, 1),
            performance_score = round((65 + random()*30)::numeric, 1)
    """)
    print(f"   [OK] suppliers altered and backfilled ({cur.rowcount} rows)")

    # ── 1B. ALTER purchase_orders ────────────────────────────────
    print("\n[2/6] Altering purchase_orders table...")
    for col_sql in [
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ai_recommended BOOLEAN DEFAULT FALSE",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS baseline_price FLOAT",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS actual_price FLOAT",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS procurement_success BOOLEAN DEFAULT FALSE",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS fulfilled_on_time BOOLEAN DEFAULT FALSE",
    ]:
        cur.execute(col_sql)

    # Backfill — use total_amount as the base since unit_price is on order_items
    cur.execute("""
        UPDATE purchase_orders SET
            ai_recommended = (random() > 0.5),
            baseline_price = CASE
                WHEN total_amount IS NOT NULL THEN round((total_amount * (1 + random()*0.15))::numeric, 2)
                ELSE round((500 + random()*2000)::numeric, 2)
            END,
            actual_price = CASE
                WHEN total_amount IS NOT NULL THEN total_amount
                ELSE round((400 + random()*1800)::numeric, 2)
            END,
            procurement_success = (random() > 0.3),
            fulfilled_on_time = (random() > 0.35)
    """)
    print(f"   [OK] purchase_orders altered and backfilled ({cur.rowcount} rows)")

    # ── 1C. CREATE competitor_pricing ────────────────────────────
    print("\n[3/6] Creating and seeding competitor_pricing table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS competitor_pricing (
            id SERIAL PRIMARY KEY,
            competitor_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            avg_price FLOAT NOT NULL,
            demand_index FLOAT NOT NULL DEFAULT 90.0,
            recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute("DELETE FROM competitor_pricing")  # idempotent re-seed

    competitors = ["LocalMart", "SpeedKart", "HyperDeal", "BazaarNow"]
    products = ["Brake Pads", "Oil Filters", "Spark Plugs"]
    today = date.today()
    rows = []
    for comp in competitors:
        base_price = random.uniform(100, 115)
        base_demand = random.uniform(80, 100)
        for prod in products:
            prod_offset = random.uniform(-5, 5)
            for day_offset in range(30):
                d = today - timedelta(days=29 - day_offset)
                price = round(base_price + prod_offset + random.uniform(-8, 8), 2)
                price = max(95, min(125, price))
                demand = round(base_demand + random.uniform(-20, 20), 1)
                demand = max(60, min(120, demand))
                rows.append((comp, prod, price, demand, d))
    cur.executemany(
        "INSERT INTO competitor_pricing (competitor_name, product_name, avg_price, demand_index, recorded_date) VALUES (%s, %s, %s, %s, %s)",
        rows,
    )
    print(f"   [OK] competitor_pricing seeded ({len(rows)} rows)")

    # ── 1D. CREATE inventory_snapshots ───────────────────────────
    print("\n[4/6] Creating and seeding inventory_snapshots table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory_snapshots (
            id SERIAL PRIMARY KEY,
            product_name TEXT NOT NULL,
            stock_level INTEGER NOT NULL,
            snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute("DELETE FROM inventory_snapshots")

    snapshot_products = ["Brake Pads", "Oil Filters", "Spark Plugs", "Air Filters", "Engine Oil"]
    rows = []
    for prod in snapshot_products:
        stock = random.randint(80, 150)
        for day_offset in range(60):
            d = today - timedelta(days=59 - day_offset)
            # Decrease stock by 1-5 per day, occasional restocking spike
            stock -= random.randint(1, 5)
            if stock <= 10 or (random.random() < 0.1):
                stock += random.randint(40, 80)  # restock
            stock = max(0, min(200, stock))
            rows.append((prod, stock, d))
    cur.executemany(
        "INSERT INTO inventory_snapshots (product_name, stock_level, snapshot_date) VALUES (%s, %s, %s)",
        rows,
    )
    print(f"   [OK] inventory_snapshots seeded ({len(rows)} rows)")

    # ── 1E. CREATE ai_response_log ───────────────────────────────
    print("\n[5/6] Creating and seeding ai_response_log table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_response_log (
            id SERIAL PRIMARY KEY,
            competitor_zone TEXT NOT NULL,
            market_event_type TEXT NOT NULL,
            market_event_timestamp TIMESTAMPTZ NOT NULL,
            recommendation_timestamp TIMESTAMPTZ NOT NULL,
            response_time_minutes FLOAT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute("DELETE FROM ai_response_log")

    event_types = ["price_drop", "price_surge", "stock_out", "new_promotion", "demand_spike"]
    rows = []
    for comp in competitors:
        for _ in range(20):
            event_time = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )
            resp_minutes = round(random.uniform(1.0, 2.6), 2)
            rec_time = event_time + timedelta(minutes=resp_minutes)
            rows.append((
                comp,
                random.choice(event_types),
                event_time,
                rec_time,
                resp_minutes,
            ))
    cur.executemany(
        "INSERT INTO ai_response_log (competitor_zone, market_event_type, market_event_timestamp, recommendation_timestamp, response_time_minutes) VALUES (%s, %s, %s, %s, %s)",
        rows,
    )
    print(f"   [OK] ai_response_log seeded ({len(rows)} rows)")

    # ── 1F. CREATE forecast_errors ───────────────────────────────
    print("\n[6/6] Creating and seeding forecast_errors table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS forecast_errors (
            id SERIAL PRIMARY KEY,
            product_name TEXT NOT NULL,
            forecast_date DATE NOT NULL,
            predicted_demand FLOAT NOT NULL,
            actual_demand FLOAT NOT NULL,
            forecast_error FLOAT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute("DELETE FROM forecast_errors")

    fc_products = ["Brake Pads", "Oil Filters", "Spark Plugs", "Air Filters"]
    rows = []
    for prod in fc_products:
        base_demand = random.uniform(15, 25)
        for day_offset in range(30):
            d = today - timedelta(days=29 - day_offset)
            actual = round(base_demand + random.uniform(-4, 4), 1)
            error = round(random.uniform(-3, 3), 1)
            predicted = round(actual - error, 1)  # error = actual - predicted
            rows.append((prod, d, predicted, actual, error))
    cur.executemany(
        "INSERT INTO forecast_errors (product_name, forecast_date, predicted_demand, actual_demand, forecast_error) VALUES (%s, %s, %s, %s, %s)",
        rows,
    )
    print(f"   [OK] forecast_errors seeded ({len(rows)} rows)")

    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print("ALL TABLES CREATED AND SEEDED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run()
