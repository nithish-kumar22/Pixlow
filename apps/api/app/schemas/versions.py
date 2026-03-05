"""Pydantic schemas for version endpoints."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class VersionCreate(BaseModel):
    ir: dict = Field(...)
    message: str | None = None


class VersionListItem(BaseModel):
    id: UUID
    project_id: UUID
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VersionResponse(BaseModel):
    id: UUID
    project_id: UUID
    ir_snapshot: dict
    ir_hash: str | None
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
