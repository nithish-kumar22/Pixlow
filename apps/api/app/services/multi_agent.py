"""In-process multi-agent orchestration for prompt generation runs."""
import asyncio
import json
import logging
import uuid
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.schemas.generation_runs import (
    ArchitectureSpec,
    BackendSpec,
    DatabaseSpec,
    DebugSpec,
    FrontendSpec,
    TaskPlanSpec,
    UiUxSpec,
)
from app.services.generation_runs import (
    create_artifact,
    create_event,
    create_step,
    get_run,
    update_run,
    update_step,
)
from app.services.llm import LLMGenerationError, generate_ir, generate_structured_artifact
from app.services.versions import create_version_for_project

logger = logging.getLogger(__name__)

AGENT_ARTIFACT_VALIDATION_MAX_ATTEMPTS = 2


@dataclass(frozen=True)
class AgentDefinition:
    stage: str
    role: str
    artifact_type: str
    title: str
    model_cls: type


AGENT_PIPELINE: list[AgentDefinition] = [
    AgentDefinition("planning", "architect", "architecture_spec", "Architecture", ArchitectureSpec),
    AgentDefinition("planning", "task_planner", "task_plan", "Execution Plan", TaskPlanSpec),
    AgentDefinition("designing", "ui_ux", "ui_ux_spec", "UI/UX Direction", UiUxSpec),
    AgentDefinition("implementation", "frontend", "frontend_spec", "Frontend Notes", FrontendSpec),
    AgentDefinition("implementation", "backend", "backend_spec", "Backend Notes", BackendSpec),
    AgentDefinition("implementation", "database", "database_spec", "Database Notes", DatabaseSpec),
]


def _schema_instructions(model_cls: type) -> str:
    schema = model_cls.model_json_schema() if hasattr(model_cls, "model_json_schema") else {}
    return json.dumps(schema, indent=2)


def _build_system_prompt(role: str, model_cls: type) -> str:
    role_map = {
        "architect": "You are the Architect agent for a mobile app generation workflow.",
        "task_planner": "You are the Task Planner agent for a mobile app generation workflow.",
        "ui_ux": "You are the UI/UX agent for a mobile app generation workflow.",
        "frontend": "You are the Frontend agent for a mobile app generation workflow.",
        "backend": "You are the Backend agent for a mobile app generation workflow.",
        "database": "You are the Database agent for a mobile app generation workflow.",
    }
    guidance = [
        role_map.get(role, "You are a specialist agent in a mobile app generation workflow."),
        "Return only valid JSON. No markdown. No prose outside the JSON object.",
        "The JSON schema below is for reference only. Do not echo the schema (do not include `$defs`).",
        "Be concrete and implementation-oriented. Align to the existing React Native IR-first architecture.",
        "Do not invent unsupported UI components beyond the known React Native IR catalog.",
        "Use concise, high-signal values. Prefer short strings and arrays over paragraphs.",
        "The required JSON schema is:",
        _schema_instructions(model_cls),
    ]
    return "\n\n".join(guidance)


def _build_user_message(
    *,
    prompt: str,
    platform: str,
    context_sections: list[str],
    role: str,
) -> str:
    sections = [
        f"Target platform: {platform}",
        f"User app request:\n{prompt.strip()}",
    ]
    if context_sections:
        sections.append("Upstream agent context:\n" + "\n\n".join(context_sections))
    role_objective = {
        "architect": "Define the blueprint, screen structure, features, and constraints.",
        "task_planner": "Turn the blueprint into milestones, dependencies, and execution risks.",
        "ui_ux": "Define interaction, visual direction, screen purpose, and theme guidance.",
        "frontend": "Define implementation notes that help generate IR and preview-safe UI.",
        "backend": "Define backend/API/auth behavior implied by the requested app.",
        "database": "Define persistence structure and relationships implied by the requested app.",
    }
    sections.append("Your task:\n" + role_objective.get(role, "Produce the requested artifact."))
    return "\n\n".join(sections)


def _artifact_summary(content: dict[str, Any]) -> str:
    summary = content.get("summary")
    if isinstance(summary, str) and summary.strip():
        return summary.strip()
    for key in ("product_summary", "design_direction", "delivery_strategy", "issue"):
        value = content.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return "Completed"


def _artifact_context(title: str, content: dict[str, Any]) -> str:
    return f"{title}:\n{json.dumps(content, indent=2)}"


async def _record_debug_failure(
    db: AsyncSession,
    *,
    run_id: uuid.UUID,
    step_order: int,
    stage: str,
    error: Exception,
) -> None:
    message = str(error) or error.__class__.__name__
    retryable = isinstance(error, (LLMGenerationError, ValidationError))
    debug_content = DebugSpec(
        summary="The multi-agent run failed and needs corrective action.",
        issue=message,
        cause="Agent generation or final IR assembly failed before a valid version could be saved.",
        recommended_fix="Inspect the failed step artifact and retry generation after tightening the prompt or reducing scope.",
        retryable=retryable,
    ).model_dump()
    step = await create_step(
        db,
        run_id=run_id,
        stage=stage,
        agent_role="debugging",
        step_order=step_order,
        status="failed",
        summary=debug_content["summary"],
    )
    await update_step(
        db,
        step["id"],
        status="failed",
        summary=debug_content["summary"],
        error_message=message,
        completed=True,
    )
    await create_artifact(
        db,
        run_id=run_id,
        step_id=step["id"],
        agent_role="debugging",
        artifact_type="debug_report",
        title="Debug Report",
        content=debug_content,
    )
    await create_event(
        db,
        run_id=run_id,
        stage=stage,
        agent_role="debugging",
        event_type="step.failed",
        message=message,
        payload={"retryable": retryable},
    )


async def run_generation_pipeline(
    db: AsyncSession,
    *,
    run_id: uuid.UUID,
    project_id: uuid.UUID,
    owner_id: uuid.UUID,
    prompt: str,
    platform: str,
) -> dict[str, Any]:
    context_sections: list[str] = []
    step_order = 1
    try:
        await update_run(
            db,
            run_id,
            status="in_progress",
            current_stage="planning",
            active_agent_role="project_manager",
        )
        await create_event(
            db,
            run_id=run_id,
            stage="planning",
            agent_role="project_manager",
            event_type="run.started",
            message="Multi-agent generation started.",
        )
        await db.commit()

        for agent in AGENT_PIPELINE:
            await update_run(
                db,
                run_id,
                status="in_progress",
                current_stage=agent.stage,
                active_agent_role=agent.role,
                error_message=None,
            )
            step = await create_step(
                db,
                run_id=run_id,
                stage=agent.stage,
                agent_role=agent.role,
                step_order=step_order,
                status="in_progress",
            )
            await create_event(
                db,
                run_id=run_id,
                stage=agent.stage,
                agent_role=agent.role,
                event_type="step.started",
                message=f"{agent.title} started.",
            )
            await db.commit()

            system_prompt = _build_system_prompt(agent.role, agent.model_cls)
            base_user_message = _build_user_message(
                prompt=prompt,
                platform=platform,
                context_sections=context_sections,
                role=agent.role,
            )

            last_validation_error: ValidationError | None = None
            for attempt in range(AGENT_ARTIFACT_VALIDATION_MAX_ATTEMPTS):
                user_message = base_user_message
                if attempt > 0 and last_validation_error is not None:
                    user_message = (
                        base_user_message
                        + "\n\nPrevious validation error for this artifact:\n"
                        + str(last_validation_error)
                        + "\n\nReturn only a corrected JSON object that matches the schema."
                        + " Do not echo the schema or include `$defs`."
                        + " Ensure all required top-level fields are present."
                    )

                raw_artifact = await asyncio.to_thread(
                    generate_structured_artifact,
                    system_prompt=system_prompt,
                    user_message=user_message,
                )
                try:
                    artifact = agent.model_cls.model_validate(raw_artifact).model_dump()
                    last_validation_error = None
                    break
                except ValidationError as e:
                    last_validation_error = e
                    if attempt >= AGENT_ARTIFACT_VALIDATION_MAX_ATTEMPTS - 1:
                        raise

            summary = _artifact_summary(artifact)
            await create_artifact(
                db,
                run_id=run_id,
                step_id=step["id"],
                agent_role=agent.role,
                artifact_type=agent.artifact_type,
                title=agent.title,
                content=artifact,
            )
            await update_step(db, step["id"], status="completed", summary=summary, completed=True)
            await create_event(
                db,
                run_id=run_id,
                stage=agent.stage,
                agent_role=agent.role,
                event_type="step.completed",
                message=summary,
            )
            await db.commit()

            context_sections.append(_artifact_context(agent.title, artifact))
            step_order += 1

        await update_run(
            db,
            run_id,
            status="in_progress",
            current_stage="review",
            active_agent_role="project_manager",
        )
        final_step = await create_step(
            db,
            run_id=run_id,
            stage="review",
            agent_role="project_manager",
            step_order=step_order,
            status="in_progress",
        )
        await create_event(
            db,
            run_id=run_id,
            stage="review",
            agent_role="project_manager",
            event_type="step.started",
            message="Project Manager is assembling the final IR.",
        )
        await db.commit()

        ir = await asyncio.to_thread(generate_ir, prompt, platform, context_sections)
        created = await create_version_for_project(db, project_id, ir, message="Multi-agent generation")
        await create_artifact(
            db,
            run_id=run_id,
            step_id=final_step["id"],
            agent_role="project_manager",
            artifact_type="final_ir",
            title="Final IR",
            content=ir,
        )
        await update_step(
            db,
            final_step["id"],
            status="completed",
            summary="Final IR validated and saved as a project version.",
            completed=True,
        )
        await update_run(
            db,
            run_id,
            status="completed",
            current_stage="completed",
            active_agent_role="project_manager",
            result_version_id=created["id"],
            completed=True,
        )
        await create_event(
            db,
            run_id=run_id,
            stage="completed",
            agent_role="project_manager",
            event_type="run.completed",
            message="Multi-agent generation completed successfully.",
            payload={"version_id": str(created["id"])},
        )
        await db.commit()
        run = await get_run(db, run_id, owner_id)
        if run is None:
            raise RuntimeError("Generation run disappeared after completion")
        return run
    except Exception as exc:
        logger.exception("Generation pipeline failed for run %s", run_id)
        await _record_debug_failure(
            db,
            run_id=run_id,
            step_order=step_order + 1,
            stage="failed",
            error=exc,
        )
        await update_run(
            db,
            run_id,
            status="failed",
            current_stage="failed",
            active_agent_role="debugging",
            error_message=str(exc),
            completed=True,
        )
        await db.commit()
        raise


async def run_generation_pipeline_in_background(run_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text(
                """
                SELECT r.id, r.project_id, r.owner_id, r.prompt, p.platform
                FROM generation_runs r
                JOIN projects p ON p.id = r.project_id
                WHERE r.id = :run_id
                """
            ),
            {"run_id": run_id},
        )
        row = result.mappings().first()
        if not row:
            logger.warning("Generation run %s not found for background execution", run_id)
            return
        try:
            await run_generation_pipeline(
                db,
                run_id=row["id"],
                project_id=row["project_id"],
                owner_id=row["owner_id"],
                prompt=row["prompt"],
                platform=row["platform"] or "react-native",
            )
        except Exception:
            # The pipeline already persisted failure details.
            return
