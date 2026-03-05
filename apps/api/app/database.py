"""
Async database connection for FastAPI.
Uses DATABASE_URL with postgresql+asyncpg driver.
"""
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

def _get_url() -> str:
    url = os.getenv("DATABASE_URL", "")
    if url and url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    _get_url(),
    pool_pre_ping=True,
    echo=os.getenv("SQL_ECHO", "").lower() in ("1", "true"),
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
