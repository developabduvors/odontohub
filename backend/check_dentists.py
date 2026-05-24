import sqlite3
import os

db_path = "sql_app.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, user_id, full_name, verification_status FROM dentist_profiles;")
rows = cur.fetchall()
for row in rows:
    print(row)
conn.close()
