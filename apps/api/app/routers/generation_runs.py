"""Generation run APIs for async multi-agent workflow inspection."""
import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.generation import GenerateRequest
from app.schemas.generation_runs import (
    ArtifactResponse,
    CreateGenerationRunResponse,
    GenerationRunResponse,
    RunEventResponse,
)
from app.services.generation_runs import create_run, get_run, list_artifacts, list_events
from app.services.multi_agent import run_generation_pipeline_in_background

router = APIRouter()

PROMPT_MIN_LEN = 10
PROMPT_MAX_LEN = 4000


async def _verify_project_owner(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> dict | None:
    result = await db.execute(
        text(
            """
            SELECT id, platform, head_version_id
            FROM projects
            WHERE id = :id AND owner_id = :user_id AND deleted_at IS NULL
            """
        ),
        {"id": project_id, "user_id": user_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


@router.post("/projects/{project_id}/generation-runs", response_model=CreateGenerationRunResponse, status_code=202)
async def create_generation_run(
    project_id: uuid.UUID,
    body: GenerateRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CreateGenerationRunResponse:
    project = await _verify_project_owner(db, project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    prompt = (body.prompt or "").strip()
    if len(prompt) < PROMPT_MIN_LEN:
        raise HTTPException(status_code=400, detail=f"Prompt must be at least {PROMPT_MIN_LEN} characters")
    if len(prompt) > PROMPT_MAX_LEN:
        raise HTTPException(status_code=400, detail=f"Prompt must be at most {PROMPT_MAX_LEN} characters")

    run = await create_run(
        db,
        project_id=project_id,
        owner_id=user_id,
        prompt=prompt,
        source_version_id=project["head_version_id"],
    )
    await db.commit()
    asyncio.create_task(run_generation_pipeline_in_background(run["id"]))

    hydrated = await get_run(db, run["id"], user_id)
    if hydrated is None:
        raise HTTPException(status_code=500, detail="Failed to create generation run")
    return CreateGenerationRunResponse(run=GenerationRunResponse(**hydrated))


@router.get("/generation-runs/{run_id}", response_model=GenerationRunResponse)
async def get_generation_run(
    run_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GenerationRunResponse:
    run = await get_run(db, run_id, user_id)
    if not run:
        raise HTTPException(status_code=404, detail="Generation run not found")
    return GenerationRunResponse(**run)


@router.get("/generation-runs/{run_id}/artifacts", response_model=list[ArtifactResponse])
async def get_generation_run_artifacts(
    run_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ArtifactResponse]:
    run = await get_run(db, run_id, user_id)
    if not run:
        raise HTTPException(status_code=404, detail="Generation run not found")
    return [ArtifactResponse(**item) for item in await list_artifacts(db, run_id)]


@router.get("/generation-runs/{run_id}/events", response_model=list[RunEventResponse])
async def get_generation_run_events(
    run_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RunEventResponse]:
    run = await get_run(db, run_id, user_id)
    if not run:
        raise HTTPException(status_code=404, detail="Generation run not found")
    return [RunEventResponse(**item) for item in await list_events(db, run_id)]
