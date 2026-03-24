"""Schemas for persisted multi-agent generation runs and artifacts."""
from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

GenerationRunStatus = Literal["queued", "in_progress", "completed", "failed", "needs_input"]
GenerationStage = Literal["draft", "planning", "designing", "implementation", "review", "completed", "failed"]
AgentRole = Literal[
    "project_manager",
    "architect",
    "task_planner",
    "ui_ux",
    "frontend",
    "backend",
    "database",
    "debugging",
]
StepStatus = Literal["queued", "in_progress", "completed", "failed", "skipped"]


class RunStepResponse(BaseModel):
    id: UUID
    stage: GenerationStage
    agent_role: AgentRole
    step_order: int
    status: StepStatus
    summary: str | None = None
    error_message: str | None = None
    started_at: datetime
    completed_at: datetime | None = None


class ArtifactResponse(BaseModel):
    id: UUID
    step_id: UUID | None = None
    agent_role: AgentRole
    artifact_type: str
    title: str
    content: dict[str, Any]
    created_at: datetime


class RunEventResponse(BaseModel):
    id: UUID
    stage: str | None = None
    agent_role: str | None = None
    event_type: str
    message: str
    payload: dict[str, Any] | None = None
    created_at: datetime


class GenerationRunResponse(BaseModel):
    id: UUID
    project_id: UUID
    owner_id: UUID
    source_version_id: UUID | None = None
    result_version_id: UUID | None = None
    prompt: str
    status: GenerationRunStatus
    current_stage: str
    active_agent_role: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    steps: list[RunStepResponse] = Field(default_factory=list)
    artifacts: list[ArtifactResponse] = Field(default_factory=list)


class CreateGenerationRunResponse(BaseModel):
    run: GenerationRunResponse


class AgentArtifactBase(BaseModel):
    summary: str


class ArchitectureSpec(AgentArtifactBase):
    app_type: str
    complexity: Literal["low", "medium", "high"]
    product_summary: str
    screens: list[str]
    key_features: list[str]
    technical_constraints: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)


class TaskPlanMilestone(BaseModel):
    id: str
    title: str
    owner: str
    depends_on: list[str] = Field(default_factory=list)


class TaskPlanSpec(AgentArtifactBase):
    delivery_strategy: str
    milestones: list[TaskPlanMilestone]
    risks: list[str] = Field(default_factory=list)


class ScreenGuideline(BaseModel):
    screen_id: str
    purpose: str
    key_components: list[str] = Field(default_factory=list)
    interactions: list[str] = Field(default_factory=list)


class ThemeGuideline(BaseModel):
    primary_color: str
    accent_color: str
    font_family: str
    visual_style: str


class UiUxSpec(AgentArtifactBase):
    design_direction: str
    theme: ThemeGuideline
    screens: list[ScreenGuideline]


class FrontendSpec(AgentArtifactBase):
    implementation_notes: list[str]
    component_mapping: list[str] = Field(default_factory=list)
    preview_focus: list[str] = Field(default_factory=list)


class BackendSpec(AgentArtifactBase):
    endpoints: list[str] = Field(default_factory=list)
    auth_requirements: list[str] = Field(default_factory=list)
    integrations: list[str] = Field(default_factory=list)
    server_behaviors: list[str] = Field(default_factory=list)


class DatabaseSpec(AgentArtifactBase):
    entities: list[str] = Field(default_factory=list)
    relationships: list[str] = Field(default_factory=list)
    persistence_notes: list[str] = Field(default_factory=list)


class DebugSpec(AgentArtifactBase):
    issue: str
    cause: str
    recommended_fix: str
    retryable: bool
