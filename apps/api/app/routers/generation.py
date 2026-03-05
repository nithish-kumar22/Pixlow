"""Generation endpoint: prompt -> IR. M08: full LLM integration via OpenRouter."""
import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.services.llm import LLMGenerationError, generate_ir
from app.services.versions import create_version_for_project

router = APIRouter()

PROMPT_MIN_LEN = 10
PROMPT_MAX_LEN = 4000


async def _verify_project_owner(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        text("SELECT id FROM projects WHERE id = :id AND owner_id = :user_id AND deleted_at IS NULL"),
        {"id": project_id, "user_id": user_id},
    )
    return result.mappings().first() is not None


async def _get_project_platform(db: AsyncSession, project_id: uuid.UUID) -> str:
    """Return project platform; default to react-native for MVP."""
    result = await db.execute(
        text("SELECT platform FROM projects WHERE id = :id"),
        {"id": project_id},
    )
    row = result.mappings().first()
    return (row["platform"] or "react-native") if row else "react-native"


@router.post("/projects/{project_id}/generate", response_model=GenerateResponse)
async def generate(
    project_id: uuid.UUID,
    body: GenerateRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GenerateResponse:
    """
    Generate IR from prompt via OpenRouter LLM. Creates a new version and sets it as head.
    Returns validated IR. On LLM/validation failure returns 400 or 502.
    """
    if not await _verify_project_owner(db, project_id, user_id):
        raise HTTPException(status_code=404, detail="Project not found")
    prompt = (body.prompt or "").strip()
    if len(prompt) < PROMPT_MIN_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt must be at least {PROMPT_MIN_LEN} characters",
        )
    if len(prompt) > PROMPT_MAX_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt must be at most {PROMPT_MAX_LEN} characters",
        )

    platform = await _get_project_platform(db, project_id)

    try:
        ir = await asyncio.to_thread(generate_ir, prompt, platform)
    except LLMGenerationError as e:
        detail = str(e)
        if "configuration" in detail or "OPENROUTER" in detail:
            raise HTTPException(status_code=502, detail=detail) from e
        raise HTTPException(status_code=400, detail=detail) from e

    created = await create_version_for_project(db, project_id, ir, message="Initial generation")
    await db.commit()

    return GenerateResponse(
        ir=ir,
        version_id=created["id"],
        created_at=created["created_at"],
    )
