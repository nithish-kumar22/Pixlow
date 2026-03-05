"""
Alembic environment for async migrations.
Reads DATABASE_URL from environment; use postgresql+asyncpg for online migrations.
"""
import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Alembic Config object
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# No ORM models in M02; schema is defined in migrations only.
target_metadata = None


def get_url() -> str:
    """Get database URL from DATABASE_URL env, convert to asyncpg driver if needed."""
    url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url") or ""
    if url and url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode. Outputs SQL to script; no DB connection needed."""
    url = get_url()
    if not url:
        url = "postgresql+asyncpg://localhost/postgres"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using async engine (DATABASE_URL from env)."""
    url = get_url()
    if not url:
        raise RuntimeError("Set DATABASE_URL environment variable to run migrations.")
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = url
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
