"""Version list, create, and get by id; project ownership verified."""
import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.versions import VersionCreate, VersionListItem, VersionResponse
from app.services.versions import create_version_for_project

router = APIRouter()


async def _verify_project_owner(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Return True if project exists, is not deleted, and user is owner."""
    result = await db.execute(
        text("SELECT id FROM projects WHERE id = :id AND owner_id = :user_id AND deleted_at IS NULL"),
        {"id": project_id, "user_id": user_id},
    )
    return result.mappings().first() is not None


@router.get("/projects/{project_id}/versions", response_model=list[VersionListItem])
async def list_versions(
    project_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[VersionListItem]:
    """List versions for a project; 404 if project not found or not owner."""
    if not await _verify_project_owner(db, project_id, user_id):
        raise HTTPException(status_code=404, detail="Project not found")
    result = await db.execute(
        text("""
            SELECT id, project_id, message, created_at
            FROM project_versions
            WHERE project_id = :project_id
            ORDER BY created_at DESC
        """),
        {"project_id": project_id},
    )
    rows = result.mappings().all()
    return [VersionListItem(**dict(r)) for r in rows]


@router.post("/projects/{project_id}/versions", response_model=VersionResponse, status_code=201)
async def create_version(
    project_id: uuid.UUID,
    body: VersionCreate,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VersionResponse:
    """Create a version and set as project head; 404 if project not found or not owner."""
    if not await _verify_project_owner(db, project_id, user_id):
        raise HTTPException(status_code=404, detail="Project not found")
    created = await create_version_for_project(db, project_id, body.ir, message=body.message)
    await db.commit()
    return VersionResponse(**created)


@router.get("/versions/{version_id}", response_model=VersionResponse)
async def get_version(
    version_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VersionResponse:
    """Get one version by id; 404 if not found or project not owned."""
    result = await db.execute(
        text("""
            SELECT v.id, v.project_id, v.ir_snapshot, v.ir_hash, v.message, v.created_at
            FROM project_versions v
            JOIN projects p ON p.id = v.project_id
            WHERE v.id = :version_id AND p.owner_id = :user_id AND p.deleted_at IS NULL
        """),
        {"version_id": version_id, "user_id": user_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Version not found")
    snap = row["ir_snapshot"]
    if isinstance(snap, str):
        snap = json.loads(snap)
    return VersionResponse(
        id=row["id"],
        project_id=row["project_id"],
        ir_snapshot=snap,
        ir_hash=row["ir_hash"],
        message=row["message"],
        created_at=row["created_at"],
    )
