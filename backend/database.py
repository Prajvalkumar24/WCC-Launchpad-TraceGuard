import sqlite3
import shutil
import os

PROD_DB = "production.db"
SNAPSHOT_DB = "snapshot_safe.db"

def init_database():
    """Initializes the mock enterprise database and creates a clean snapshot."""
    conn = sqlite3.connect(PROD_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            account_balance REAL NOT NULL,
            status TEXT NOT NULL
        )
    """)
    cursor.execute("DELETE FROM customer_records")
    sample_data = [
        ('Apex Logistics', 142500.0, 'Active'),
        ('Nordic Horizon Ltd', 98000.5, 'Active'),
        ('Vanguard Systems', 450000.0, 'Critical')
    ]
    cursor.executemany("INSERT INTO customer_records (name, account_balance, status) VALUES (?, ?, ?)", sample_data)
    conn.commit()
    conn.close()
    shutil.copyfile(PROD_DB, SNAPSHOT_DB)

def get_current_records():
    if not os.path.exists(PROD_DB):
        init_database()
    conn = sqlite3.connect(PROD_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, account_balance, status FROM customer_records")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "balance": r[2], "status": r[3]} for r in rows]

def execute_raw_sql(query: str):
    conn = sqlite3.connect(PROD_DB)
    cursor = conn.cursor()
    cursor.executescript(query)
    conn.commit()
    conn.close()

def restore_snapshot():
    if os.path.exists(SNAPSHOT_DB):
        shutil.copyfile(SNAPSHOT_DB, PROD_DB)
        return True
    return False