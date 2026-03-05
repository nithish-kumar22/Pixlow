"""
Clerk JWT verification and current-user dependency for protected routes.
Validates Bearer token via Clerk JWKS; resolves to internal user id from users table.
"""
import os
import time
import uuid
from typing import Annotated

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal

# Cache JWKS for 1 hour; Clerk rotates keys rarely
_JWKS_CACHE: dict[str, tuple[PyJWKClient, float]] = {}
_CACHE_TTL_SEC = 3600


def _get_jwks_url() -> str:
    url = os.getenv("CLERK_JWKS_URL", "").strip()
    if not url:
        raise HTTPException(
            status_code=500,
            detail="CLERK_JWKS_URL not configured",
        )
    return url


def _get_jwks_client() -> PyJWKClient:
    url = _get_jwks_url()
    now = time.monotonic()
    if url in _JWKS_CACHE:
        client, cached_at = _JWKS_CACHE[url]
        if now - cached_at < _CACHE_TTL_SEC:
            return client
    client = PyJWKClient(url)
    _JWKS_CACHE[url] = (client, now)
    return client


def _verify_token(token: str) -> dict:
    """Verify Clerk JWT and return payload. Raises on invalid token."""
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_id(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> uuid.UUID:
    """
    Extract Bearer token, verify with Clerk JWKS, resolve to internal user id.
    Raises 401 if missing, invalid, or user not synced to DB.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _verify_token(token)
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=401,
            detail="Token missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
            {"clerk_id": clerk_id},
        )
        row = result.mappings().first()
        user_id = row["id"] if row else None
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="User not found; sign in again or ensure user sync has run",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
