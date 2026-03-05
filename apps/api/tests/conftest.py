"""Pytest configuration. Set dummy DATABASE_URL so app modules can be imported without a real DB."""
import os

# Allow app.database to create engine during collection (no connection until tests use DB)
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://localhost:5432/test_pixlow"
