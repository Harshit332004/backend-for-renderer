import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env')
db_url = os.environ['SYNC_DATABASE_URL'].replace('postgresql+psycopg2://', 'postgresql://').split('?')[0]
conn = psycopg2.connect(db_url)
cur = conn.cursor()

queries = {
    'suppliers constraints': """
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'suppliers';
    """,
    'purchase_orders columns': """
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_orders';
    """,
    'competitor_pricing count': "SELECT COUNT(*) FROM competitor_pricing;",
    'inventory_snapshots count': "SELECT COUNT(*) FROM inventory_snapshots;",
    'ai_response_log count': "SELECT COUNT(*) FROM ai_response_log;",
    'forecast_errors count': "SELECT COUNT(*) FROM forecast_errors;",
    'competitors distinct': "SELECT DISTINCT competitor_name FROM competitor_pricing;",
    'forecast products distinct': "SELECT DISTINCT product_name FROM forecast_errors;"
}

for name, q in queries.items():
    print(f'--- {name} ---')
    cur.execute(q)
    rows = cur.fetchall()
    for r in rows: print(r)
