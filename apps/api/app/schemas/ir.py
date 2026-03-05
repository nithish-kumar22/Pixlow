"""Pydantic IR schema (port of M05). Validates LLM output for AppIR."""
from typing import Any, Literal

from pydantic import BaseModel, Field

IR_VERSION = "1.0"

LAYOUT_NODE_TYPES = Literal[
    "View",
    "Text",
    "Image",
    "Button",
    "TextInput",
    "FlatList",
    "ScrollView",
    "SafeAreaView",
]


class EventPayload(BaseModel):
    """Event handler payload: action (e.g. navigate) and optional target."""

    action: str
    target: str | None = None


class LayoutNode(BaseModel):
    """Recursive layout node: single root per screen, tree of nodes."""

    id: str
    type: LAYOUT_NODE_TYPES
    props: dict[str, Any] = Field(default_factory=dict)
    style: dict[str, Any] = Field(default_factory=dict)
    children: list["LayoutNode"] | None = None
    events: dict[str, EventPayload] | None = None


LayoutNode.model_rebuild()


class Screen(BaseModel):
    """Screen: id, name, and single root layout node."""

    id: str
    name: str
    layout: LayoutNode


class Navigation(BaseModel):
    """Navigation: stack or tabs, with initial screen id."""

    type: Literal["stack", "tabs"]
    initialScreen: str


class Theme(BaseModel):
    """Theme: design tokens (primaryColor, fontFamily, etc.)."""

    primaryColor: str | None = None
    fontFamily: str | None = None


class AppIR(BaseModel):
    """Top-level App IR schema. At least one screen required."""

    version: str
    appId: str | None = None
    screens: list[Screen] = Field(..., min_length=1)
    navigation: Navigation
    theme: Theme = Field(default_factory=Theme)
    dataBindings: dict[str, Any] | None = None
    assets: list[Any] | None = None


class IRValidationError(ValueError):
    """Raised when IR fails schema validation. Message is suitable for retry context."""

    pass


def validate_ir(data: dict) -> dict:
    """
    Parse and validate dict against AppIR schema. Returns validated dict for JSON/storage.
    Raises IRValidationError with a clear message if validation fails.
    """
    from pydantic import ValidationError

    try:
        model = AppIR.model_validate(data)
        return model.model_dump(exclude_none=False)
    except ValidationError as e:
        parts = [f"{err.get('loc', ())}: {err.get('msg', '')}" for err in e.errors()]
        msg = "; ".join(parts) if parts else str(e)
        raise IRValidationError(f"Invalid IR: {msg}") from e
