"""Version creation helper: insert version and set project head. Used by generation and versions router."""
import hashlib
import json
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def compute_ir_hash(ir: dict) -> str:
    """Stable hash of IR for dedup."""
    return hashlib.sha256(json.dumps(ir, sort_keys=True).encode()).hexdigest()


async def create_version_for_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    ir: dict,
    message: str | None = None,
) -> dict:
    """
    Insert a new project version and set it as the project head.
    Does not commit; caller must commit.
    Returns dict with id, project_id, ir_snapshot, ir_hash, message, created_at.
    """
    ir_hash = compute_ir_hash(ir)
    head_result = await db.execute(
        text("SELECT head_version_id FROM projects WHERE id = :id"),
        {"id": project_id},
    )
    head_row = head_result.mappings().first()
    parent_id = head_row["head_version_id"] if head_row else None

    result = await db.execute(
        text("""
            INSERT INTO project_versions (project_id, parent_id, ir_snapshot, ir_hash, message, created_at)
            VALUES (:project_id, :parent_id, :ir_snapshot::jsonb, :ir_hash, :message, now())
            RETURNING id, project_id, ir_snapshot, ir_hash, message, created_at
        """),
        {
            "project_id": project_id,
            "parent_id": parent_id,
            "ir_snapshot": json.dumps(ir),
            "ir_hash": ir_hash,
            "message": message,
        },
    )
    row = result.mappings().first()
    if not row:
        raise RuntimeError("Insert failed")

    version_id = row["id"]
    await db.execute(
        text("""
            UPDATE projects SET head_version_id = :version_id, updated_at = now()
            WHERE id = :project_id
        """),
        {"version_id": version_id, "project_id": project_id},
    )

    snap = row["ir_snapshot"]
    if isinstance(snap, str):
        snap = json.loads(snap)
    return {
        "id": row["id"],
        "project_id": row["project_id"],
        "ir_snapshot": snap,
        "ir_hash": row["ir_hash"],
        "message": row["message"],
        "created_at": row["created_at"],
    }
