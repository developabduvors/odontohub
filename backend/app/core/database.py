from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

import os

DATABASE_URL = settings.DATABASE_URL or "sqlite:///./sql_app.db"

# Render provides 'postgres://' but SQLAlchemy requires 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    # Neon (serverless Postgres) closes idle connections / suspends compute,
    # leaving stale connections in the pool that fail with "SSL connection has
    # been closed unexpectedly". pool_pre_ping validates (and transparently
    # replaces) a connection before checkout; pool_recycle proactively drops
    # connections older than 5 min, below Neon's idle timeout.
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"check_same_thread": False}
    if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

from app.models.base import Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
