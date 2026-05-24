"""Audit: every SQLAlchemy model vs the live database schema.

Reports, per table:
  - columns the MODEL declares but the DB is MISSING  (-> need ALTER TABLE ADD)
  - columns the DB has but the model does not          (informational only)
  - tables the model declares that don't exist in the DB at all

For each missing column it prints the exact Postgres DDL fragment.

Run:  python audit_schema_drift.py
"""
import importlib, pkgutil
from sqlalchemy import inspect
from sqlalchemy.schema import CreateColumn
from sqlalchemy.dialects import postgresql

import app.models as models_pkg
from app.core.database import engine, Base

# Import every module under app.models so all tables register on Base.metadata
for m in pkgutil.iter_modules(models_pkg.__path__):
    importlib.import_module(f"app.models.{m.name}")

insp = inspect(engine)
db_tables = set(insp.get_table_names())
pg = postgresql.dialect()

missing_total = 0
print("=" * 70)
for table_name, table in sorted(Base.metadata.tables.items()):
    if table_name not in db_tables:
        print(f"\n[TABLE MISSING IN DB] {table_name} (model exists, no table)")
        continue

    db_cols = {c["name"] for c in insp.get_columns(table_name)}
    model_cols = {c.name for c in table.columns}

    missing = [c for c in table.columns if c.name not in db_cols]
    db_only = sorted(db_cols - model_cols)

    if missing or db_only:
        print(f"\n## {table_name}")
    for col in missing:
        missing_total += 1
        ddl = str(CreateColumn(col).compile(dialect=pg)).strip()
        print(f"   MISSING IN DB : {ddl}")
    if db_only:
        print(f"   DB-only (ignore, not in model): {db_only}")

print("\n" + "=" * 70)
print(f"TOTAL columns missing in DB (need ALTER TABLE ADD COLUMN): {missing_total}")
