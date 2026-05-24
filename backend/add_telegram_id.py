from app.core.database import engine
from sqlalchemy import text
import sys

def add_col():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN telegram_id VARCHAR;"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_id ON users(telegram_id);"))
        print("Successfully added telegram_id to users and created index")
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    # Wait to append the path so we can import app modules properly
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # Then run the column addition
    add_col()
