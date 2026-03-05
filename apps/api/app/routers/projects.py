"""Project CRUD: list, get, create, update, soft-delete."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter()


def _row_to_project_response(row: dict) -> ProjectResponse:
    return ProjectResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        platform=row["platform"],
        head_version_id=row["head_version_id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ProjectResponse]:
    """List projects for the current user (exclude soft-deleted)."""
    result = await db.execute(
        text("""
            SELECT id, name, description, platform, head_version_id, created_at, updated_at
            FROM projects
            WHERE owner_id = :user_id AND deleted_at IS NULL
            ORDER BY updated_at DESC
        """),
        {"user_id": user_id},
    )
    rows = result.mappings().all()
    return [_row_to_project_response(dict(r)) for r in rows]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectResponse:
    """Get one project; 404 if not found or not owner."""
    result = await db.execute(
        text("""
            SELECT id, name, description, platform, head_version_id, created_at, updated_at
            FROM projects
            WHERE id = :project_id AND owner_id = :user_id AND deleted_at IS NULL
        """),
        {"project_id": project_id, "user_id": user_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return _row_to_project_response(dict(row))


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectResponse:
    """Create a project; MVP sets platform to react-native."""
    result = await db.execute(
        text("""
            INSERT INTO projects (owner_id, name, description, platform, head_version_id, deleted_at, created_at, updated_at)
            VALUES (:owner_id, :name, :description, 'react-native', NULL, NULL, now(), now())
            RETURNING id, name, description, platform, head_version_id, created_at, updated_at
        """),
        {
            "owner_id": user_id,
            "name": body.name,
            "description": body.description,
        },
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail="Insert failed")
    await db.commit()
    return _row_to_project_response(dict(row))


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectResponse:
    """Update project name/description; 404 if not found or not owner."""
    # Verify ownership
    check = await db.execute(
        text("SELECT id FROM projects WHERE id = :id AND owner_id = :user_id AND deleted_at IS NULL"),
        {"id": project_id, "user_id": user_id},
    )
    if not check.mappings().first():
        raise HTTPException(status_code=404, detail="Project not found")
    # Build update: only non-None fields
    updates = []
    params: dict = {"project_id": project_id}
    if body.name is not None:
        updates.append("name = :name")
        params["name"] = body.name
    if body.description is not None:
        updates.append("description = :description")
        params["description"] = body.description
    if not updates:
        # No-op: fetch and return current
        result = await db.execute(
            text("""
                SELECT id, name, description, platform, head_version_id, created_at, updated_at
                FROM projects WHERE id = :project_id
            """),
            {"project_id": project_id},
        )
        row = result.mappings().first()
        if row:
            return _row_to_project_response(dict(row))
        raise HTTPException(status_code=404, detail="Project not found")
    updates.append("updated_at = now()")
    sql = f"UPDATE projects SET {', '.join(updates)} WHERE id = :project_id RETURNING id, name, description, platform, head_version_id, created_at, updated_at"
    result = await db.execute(text(sql), params)
    row = result.mappings().first()
    await db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return _row_to_project_response(dict(row))


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Soft-delete project; 404 if not found or not owner."""
    result = await db.execute(
        text("""
            UPDATE projects
            SET deleted_at = now(), updated_at = now()
            WHERE id = :project_id AND owner_id = :user_id AND deleted_at IS NULL
        """),
        {"project_id": project_id, "user_id": user_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Project not found")
