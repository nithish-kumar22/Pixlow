"""Pydantic schemas for generation endpoint."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.generation_runs import RunStepResponse


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class GenerateResponse(BaseModel):
    ir: dict
    version_id: UUID | None = None
    created_at: datetime | None = None
    run_id: UUID | None = None
    status: str | None = None
    stage: str | None = None
    steps: list[RunStepResponse] = Field(default_factory=list)
