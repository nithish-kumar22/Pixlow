"""Generation endpoints for synchronous compatibility and async multi-agent runs."""
import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.services.generation_runs import create_run, get_run
from app.services.llm import LLMGenerationError
from app.services.multi_agent import run_generation_pipeline

router = APIRouter()

PROMPT_MIN_LEN = 10
PROMPT_MAX_LEN = 4000


async def _verify_project_owner(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        text("SELECT id FROM projects WHERE id = :id AND owner_id = :user_id AND deleted_at IS NULL"),
        {"id": project_id, "user_id": user_id},
    )
    return result.mappings().first() is not None


async def _get_project_platform_and_head(
    db: AsyncSession, project_id: uuid.UUID
) -> tuple[str, uuid.UUID | None]:
    """Return project platform and current head version; default to react-native for MVP."""
    result = await db.execute(
        text("SELECT platform, head_version_id FROM projects WHERE id = :id"),
        {"id": project_id},
    )
    row = result.mappings().first()
    if not row:
        return "react-native", None
    return (row["platform"] or "react-native"), row["head_version_id"]


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

    platform, head_version_id = await _get_project_platform_and_head(db, project_id)

    run = await create_run(
        db,
        project_id=project_id,
        owner_id=user_id,
        prompt=prompt,
        source_version_id=head_version_id,
    )
    await db.commit()

    try:
        completed_run = await run_generation_pipeline(
            db,
            run_id=run["id"],
            project_id=project_id,
            owner_id=user_id,
            prompt=prompt,
            platform=platform,
        )
    except LLMGenerationError as e:
        detail = str(e)
        if "configuration" in detail or "OPENROUTER" in detail:
            raise HTTPException(status_code=502, detail=detail) from e
        raise HTTPException(status_code=400, detail=detail) from e
    except Exception as e:
        detail = str(e) or "Generation failed"
        raise HTTPException(status_code=400, detail=detail) from e

    result_version_id = completed_run.get("result_version_id")
    artifacts = completed_run.get("artifacts", [])
    final_ir = next((item["content"] for item in artifacts if item.get("artifact_type") == "final_ir"), None)
    if final_ir is None:
        refreshed_run = await get_run(db, run["id"], user_id)
        artifacts = refreshed_run.get("artifacts", []) if refreshed_run else []
        final_ir = next((item["content"] for item in artifacts if item.get("artifact_type") == "final_ir"), None)
    if final_ir is None:
        raise HTTPException(status_code=500, detail="Generation completed without a saved IR")

    return GenerateResponse(
        ir=final_ir,
        version_id=result_version_id,
        created_at=completed_run.get("completed_at"),
        run_id=completed_run["id"],
        status=completed_run["status"],
        stage=completed_run["current_stage"],
        steps=completed_run.get("steps", []),
    )
