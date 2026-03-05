"""
Clerk webhook handler: verify Svix signature and upsert user into users table.
Handles user.created and user.updated events.
"""
import json
import os
from typing import Any

from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import text
from svix.webhooks import Webhook, WebhookVerificationError

from app.database import AsyncSessionLocal

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")


def _get_primary_email(data: dict[str, Any]) -> str | None:
    """Extract primary email from Clerk user payload."""
    emails = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")
    for e in emails:
        if e.get("id") == primary_id:
            return e.get("email_address")
    return (emails[0].get("email_address") if emails else None) or None


def _user_from_clerk_data(data: dict[str, Any]) -> tuple[str, str | None, str | None, str | None]:
    """Extract (clerk_id, email, name, image_url) from Clerk user object."""
    clerk_id = data.get("id") or ""
    email = _get_primary_email(data)
    first = (data.get("first_name") or "").strip()
    last = (data.get("last_name") or "").strip()
    name = f"{first} {last}".strip() or None
    image_url = data.get("image_url")
    return clerk_id, email, name, image_url


@router.post("/clerk")
async def clerk_webhook(request: Request) -> dict[str, str]:
    """Receive Clerk user.created / user.updated; verify Svix signature; upsert user."""
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="CLERK_WEBHOOK_SECRET not configured")

    raw_body = await request.body()
    payload = raw_body.decode("utf-8")

    headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }
    if not all(headers.values()):
        raise HTTPException(status_code=401, detail="Missing Svix headers")

    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        body = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        raise HTTPException(status_code=401, detail=f"Invalid webhook signature: {e}") from e

    event = json.loads(body) if isinstance(body, str) else body
    event_type = event.get("type")
    if event_type not in ("user.created", "user.updated"):
        return {"status": "ignored", "type": event_type or "unknown"}

    data = event.get("data") or {}
    clerk_id, email, name, avatar_url = _user_from_clerk_data(data)
    if not clerk_id:
        raise HTTPException(status_code=400, detail="Missing user id in payload")

    sql = text("""
        INSERT INTO users (clerk_id, email, name, avatar_url, created_at, updated_at)
        VALUES (:clerk_id, :email, :name, :avatar_url, now(), now())
        ON CONFLICT (clerk_id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = now()
    """)

    async with AsyncSessionLocal() as session:
        await session.execute(
            sql,
            {"clerk_id": clerk_id, "email": email, "name": name, "avatar_url": avatar_url},
        )
        await session.commit()

    return {"status": "ok", "type": event_type}
