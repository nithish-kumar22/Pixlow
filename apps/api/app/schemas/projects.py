"""Pydantic schemas for project endpoints."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    platform: str
    head_version_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
