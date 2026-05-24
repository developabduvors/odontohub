from dotenv import load_dotenv
load_dotenv()
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.engine import make_url
from app.core.config import settings
import os

DATABASE_URL = settings.DATABASE_URL or "sqlite:///./sql_app.db"

# Convert to async format if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

# asyncpg does not support psycopg-style query args like sslmode/channel_binding.
engine_connect_args = {}
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    parsed_url = make_url(DATABASE_URL)
    query = dict(parsed_url.query)
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    if sslmode in {"require", "verify-ca", "verify-full"}:
        engine_connect_args["ssl"] = "require"
    DATABASE_URL = str(parsed_url.set(query=query))

async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    # Neon closes idle connections; validate/replace stale ones before
    # checkout and recycle ones older than 5 min (below Neon's idle timeout).
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else engine_connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
