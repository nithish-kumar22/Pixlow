"""Test auth dependency: missing or invalid token returns 401."""
import pytest
from fastapi import HTTPException

from app.auth import get_current_user_id


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
