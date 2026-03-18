"""Persistence helpers for multi-agent generation runs."""
import json
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_run(
    db: AsyncSession,
    *,
    project_id: uuid.UUID,
    owner_id: uuid.UUID,
    prompt: str,
    source_version_id: uuid.UUID | None,
) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            INSERT INTO generation_runs (
              project_id, owner_id, source_version_id, result_version_id, prompt,
              status, current_stage, active_agent_role, error_message, created_at, updated_at, completed_at
            )
            VALUES (
              :project_id, :owner_id, :source_version_id, NULL, :prompt,
              'queued', 'draft', 'project_manager', NULL, now(), now(), NULL
            )
            RETURNING *
            """
        ),
        {
            "project_id": project_id,
            "owner_id": owner_id,
            "source_version_id": source_version_id,
            "prompt": prompt,
        },
    )
    row = result.mappings().first()
    if not row:
        raise RuntimeError("Failed to create generation run")
    return dict(row)


async def update_run(
    db: AsyncSession,
    run_id: uuid.UUID,
    *,
    status: str | None = None,
    current_stage: str | None = None,
    active_agent_role: str | None = None,
    error_message: str | None = None,
    result_version_id: uuid.UUID | None = None,
    completed: bool = False,
) -> None:
    assignments = ["updated_at = now()"]
    params: dict[str, Any] = {"run_id": run_id}
    if status is not None:
        assignments.append("status = :status")
        params["status"] = status
    if current_stage is not None:
        assignments.append("current_stage = :current_stage")
        params["current_stage"] = current_stage
    if active_agent_role is not None:
        assignments.append("active_agent_role = :active_agent_role")
        params["active_agent_role"] = active_agent_role
    if error_message is not None:
        assignments.append("error_message = :error_message")
        params["error_message"] = error_message
    if result_version_id is not None:
        assignments.append("result_version_id = :result_version_id")
        params["result_version_id"] = result_version_id
    if completed:
        assignments.append("completed_at = now()")
    await db.execute(
        text(f"UPDATE generation_runs SET {', '.join(assignments)} WHERE id = :run_id"),
        params,
    )


async def create_step(
    db: AsyncSession,
    *,
    run_id: uuid.UUID,
    stage: str,
    agent_role: str,
    step_order: int,
    status: str,
    summary: str | None = None,
) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            INSERT INTO generation_run_steps (
              run_id, stage, agent_role, step_order, status, summary, error_message, started_at, completed_at
            )
            VALUES (:run_id, :stage, :agent_role, :step_order, :status, :summary, NULL, now(), NULL)
            RETURNING *
            """
        ),
        {
            "run_id": run_id,
            "stage": stage,
            "agent_role": agent_role,
            "step_order": step_order,
            "status": status,
            "summary": summary,
        },
    )
    row = result.mappings().first()
    if not row:
        raise RuntimeError("Failed to create run step")
    return dict(row)


async def update_step(
    db: AsyncSession,
    step_id: uuid.UUID,
    *,
    status: str,
    summary: str | None = None,
    error_message: str | None = None,
    completed: bool = False,
) -> None:
    assignments = ["status = :status"]
    params: dict[str, Any] = {"step_id": step_id, "status": status}
    if summary is not None:
        assignments.append("summary = :summary")
        params["summary"] = summary
    if error_message is not None:
        assignments.append("error_message = :error_message")
        params["error_message"] = error_message
    if completed:
        assignments.append("completed_at = now()")
    await db.execute(
        text(f"UPDATE generation_run_steps SET {', '.join(assignments)} WHERE id = :step_id"),
        params,
    )


async def create_artifact(
    db: AsyncSession,
    *,
    run_id: uuid.UUID,
    step_id: uuid.UUID | None,
    agent_role: str,
    artifact_type: str,
    title: str,
    content: dict[str, Any],
) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            INSERT INTO generation_artifacts (
              run_id, step_id, agent_role, artifact_type, title, content, created_at
            )
            VALUES (
              :run_id, :step_id, :agent_role, :artifact_type, :title, CAST(:content AS jsonb), now()
            )
            RETURNING *
            """
        ),
        {
            "run_id": run_id,
            "step_id": step_id,
            "agent_role": agent_role,
            "artifact_type": artifact_type,
            "title": title,
            "content": json.dumps(content),
        },
    )
    row = result.mappings().first()
    if not row:
        raise RuntimeError("Failed to create generation artifact")
    return _deserialize_artifact(dict(row))


async def create_event(
    db: AsyncSession,
    *,
    run_id: uuid.UUID,
    event_type: str,
    message: str,
    stage: str | None = None,
    agent_role: str | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    await db.execute(
        text(
            """
            INSERT INTO generation_events (
              run_id, stage, agent_role, event_type, message, payload, created_at
            )
            VALUES (
              :run_id, :stage, :agent_role, :event_type, :message, CAST(:payload AS jsonb), now()
            )
            """
        ),
        {
            "run_id": run_id,
            "stage": stage,
            "agent_role": agent_role,
            "event_type": event_type,
            "message": message,
            "payload": json.dumps(payload) if payload is not None else None,
        },
    )


def _deserialize_artifact(row: dict[str, Any]) -> dict[str, Any]:
    content = row.get("content")
    if isinstance(content, str):
        row["content"] = json.loads(content)
    return row


def _deserialize_event(row: dict[str, Any]) -> dict[str, Any]:
    payload = row.get("payload")
    if isinstance(payload, str):
        row["payload"] = json.loads(payload)
    return row


async def get_run(db: AsyncSession, run_id: uuid.UUID, owner_id: uuid.UUID) -> dict[str, Any] | None:
    run_result = await db.execute(
        text(
            """
            SELECT *
            FROM generation_runs
            WHERE id = :run_id AND owner_id = :owner_id
            """
        ),
        {"run_id": run_id, "owner_id": owner_id},
    )
    run_row = run_result.mappings().first()
    if not run_row:
        return None
    run = dict(run_row)
    run["steps"] = await list_steps(db, run_id)
    run["artifacts"] = await list_artifacts(db, run_id)
    return run


async def list_steps(db: AsyncSession, run_id: uuid.UUID) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT *
            FROM generation_run_steps
            WHERE run_id = :run_id
            ORDER BY step_order ASC, started_at ASC
            """
        ),
        {"run_id": run_id},
    )
    return [dict(row) for row in result.mappings().all()]


async def list_artifacts(db: AsyncSession, run_id: uuid.UUID) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT *
            FROM generation_artifacts
            WHERE run_id = :run_id
            ORDER BY created_at ASC
            """
        ),
        {"run_id": run_id},
    )
    return [_deserialize_artifact(dict(row)) for row in result.mappings().all()]


async def list_events(db: AsyncSession, run_id: uuid.UUID) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT *
            FROM generation_events
            WHERE run_id = :run_id
            ORDER BY created_at ASC
            """
        ),
        {"run_id": run_id},
    )
    return [_deserialize_event(dict(row)) for row in result.mappings().all()]
