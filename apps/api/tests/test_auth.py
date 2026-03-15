"""Test auth dependency: missing or invalid token returns 401."""
import os

import pytest
from fastapi import HTTPException

from app.auth import get_current_user_id

# Required so get_current_user_id can verify tokens (avoid 500 from missing JWT_SECRET)
os.environ.setdefault("JWT_SECRET", "test-secret-for-unit-tests")


@pytest.mark.asyncio
async def test_get_current_user_id_missing_auth_raises_401() -> None:
    """Missing Authorization header raises 401."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization=None)
    assert exc_info.value.status_code == 401
    assert "Authorization" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_get_current_user_id_empty_bearer_raises_401() -> None:
    """Empty Bearer token raises 401."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization="Bearer ")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_id_invalid_token_raises_401() -> None:
    """Invalid JWT raises 401."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization="Bearer invalid.jwt.here")
    assert exc_info.value.status_code == 401
    assert "Invalid" in str(exc_info.value.detail) or "expired" in str(exc_info.value.detail).lower()
