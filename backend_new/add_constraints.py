import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env')
db_url = os.environ['SYNC_DATABASE_URL'].replace('postgresql+psycopg2://', 'postgresql://').split('?')[0]
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

queries = [
    "ALTER TABLE suppliers ADD CONSTRAINT suppliers_region_check CHECK (region IN ('West','East','North','South','Central'));",
    "ALTER TABLE suppliers ADD CONSTRAINT suppliers_risk_level_check CHECK (risk_level IN ('Low','Medium','High'));",
    "ALTER TABLE suppliers ADD CONSTRAINT suppliers_compliance_score_check CHECK (compliance_score >= 0 AND compliance_score <= 100);"
]

for q in queries:
    print(f"Executing: {q}")
    try:
        cur.execute(q)
        print("Success.")
    except Exception as e:
        print(f"Error: {e}")

cur.close()
conn.close()
