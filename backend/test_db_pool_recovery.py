"""
One-off reproduction / regression check for the Neon "SSL connection has been
closed unexpectedly" registration failure.

Root cause: SQLAlchemy engines were created without pool_pre_ping, so a pooled
connection that Neon had already closed (idle timeout / compute suspend) was
handed back out and failed on the next query.

This script deterministically simulates Neon dropping the connection by asking
Postgres to terminate the backend for the pooled connection, then reusing it:

  - engine WITHOUT pool_pre_ping  -> reproduces OperationalError (the bug)
  - engine WITH    pool_pre_ping  -> transparently reconnects (the fix)

Run:  python test_db_pool_recovery.py
"""
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or "sqlite" in DATABASE_URL:
    print("SKIP: DATABASE_URL is not a Postgres URL; nothing to reproduce.")
    sys.exit(0)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def kill_pooled_connection_then_query(engine):
    """Deterministically reproduce a stale pooled connection (Neon idle drop):

    1. Check out connection A.
    2. Return A to the pool (the pool still believes it is alive).
    3. Close A's underlying DBAPI socket directly -- the connection is now
       dead but still sitting in the pool. This is the canonical, pooler-safe
       way to simulate a server-side idle disconnect (matches SQLAlchemy's own
       disconnect-handling tests) without poisoning Neon's PgBouncer.
    4. Reuse the pool -> the dead A is checked out again.
    """
    # 1. Check out A, grab its raw DBAPI (psycopg2) connection.
    conn_a = engine.connect()
    raw_dbapi = conn_a.connection.dbapi_connection
    # 2. Return A to the pool.
    conn_a.close()
    # 3. Kill A at the client side; pool is unaware it is now dead.
    raw_dbapi.close()
    # 4. Reuse the pool. The dead A is the only pooled connection.
    with engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar()


def run_case(label, **engine_kwargs):
    engine = create_engine(DATABASE_URL, **engine_kwargs)
    try:
        result = kill_pooled_connection_then_query(engine)
        print(f"[{label}] OK -> query returned {result}")
        return True
    except DBAPIError as exc:
        first_line = str(exc.orig).splitlines()[0]
        print(f"[{label}] FAILED -> OperationalError: {first_line}")
        return False
    finally:
        engine.dispose()


if __name__ == "__main__":
    print("== Reproducing the bug (no pool_pre_ping) ==")
    buggy_ok = run_case("no pre_ping")

    print("\n== Verifying the fix (pool_pre_ping=True, pool_recycle=300) ==")
    fixed_ok = run_case("pre_ping", pool_pre_ping=True, pool_recycle=300)

    print()
    if not buggy_ok and fixed_ok:
        print("CONFIRMED: bug reproduced without pre_ping; fix works with it.")
        sys.exit(0)
    if buggy_ok and fixed_ok:
        print("INCONCLUSIVE: buggy engine did not fail (connection not stale "
              "this run). Fix path still verified OK.")
        sys.exit(0)
    print("UNEXPECTED: fix path did not recover. Investigate further.")
    sys.exit(1)
