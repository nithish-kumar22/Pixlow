"""
JWT verification and current-user dependency for protected routes.
Validates Bearer token (HS256, JWT_SECRET); sub claim is user UUID.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Header, HTTPException

_JWT_ALGORITHM = "HS256"
_TOKEN_EXPIRY_HOURS = 24 * 7  # 7 days


_DEV_SECRET_WARNED = False


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        global _DEV_SECRET_WARNED
        if not _DEV_SECRET_WARNED:
            import warnings
            warnings.warn("JWT_SECRET is not set; using a development default. Set JWT_SECRET in .env for production.", UserWarning, stacklevel=2)
            _DEV_SECRET_WARNED = True
        secret = "dev-secret-change-in-production"
    return secret


def create_access_token(user_id: uuid.UUID, email: str | None = None) -> str:
    """Create a JWT with sub=user_id, exp, optional email."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRY_HOURS),
    }
    if email is not None:
        payload["email"] = email
    return jwt.encode(
        payload,
        _get_jwt_secret(),
        algorithm=_JWT_ALGORITHM,
    )


def _verify_token(token: str) -> dict:
    """Verify JWT and return payload. Raises on invalid token."""
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=[_JWT_ALGORITHM],
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
    Extract Bearer token, verify with JWT_SECRET, return user id from sub claim.
    Raises 401 if missing or invalid.
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
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=401,
            detail="Token missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return uuid.UUID(sub)
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
