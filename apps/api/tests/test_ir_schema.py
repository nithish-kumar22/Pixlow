"""Unit tests for IR schema validation (M08)."""
import json
from pathlib import Path

import pytest

from app.schemas.ir import IRValidationError, validate_ir


def _sample_ir() -> dict:
    """Load sample IR from packages/ir (same as M05 sample)."""
    sample_path = Path(__file__).resolve().parents[2] / ".." / "packages" / "ir" / "sampleIR.json"
    with open(sample_path) as f:
        return json.load(f)


def test_validate_ir_accepts_valid_sample():
    """Valid sample IR from M05 passes validation."""
    data = _sample_ir()
    result = validate_ir(data)
    assert result["version"] == "1.0"
    assert len(result["screens"]) >= 1
    assert result["navigation"]["type"] in ("stack", "tabs")
    assert result["navigation"]["initialScreen"] == "screen_home"


def test_validate_ir_accepts_minimal_valid():
    """Minimal valid IR passes."""
    minimal = {
        "version": "1.0",
        "screens": [
            {
                "id": "s1",
                "name": "Main",
                "layout": {
                    "id": "root",
                    "type": "View",
                    "props": {},
                    "style": {},
                },
            },
        ],
        "navigation": {"type": "stack", "initialScreen": "s1"},
        "theme": {},
    }
    result = validate_ir(minimal)
    assert result["version"] == "1.0"
    assert result["screens"][0]["id"] == "s1"


def test_validate_ir_rejects_missing_screens():
    """Payload without screens raises IRValidationError."""
    invalid = {
        "version": "1.0",
        "screens": [],
        "navigation": {"type": "stack", "initialScreen": "s1"},
        "theme": {},
    }
    with pytest.raises(IRValidationError) as exc_info:
        validate_ir(invalid)
    assert "screens" in str(exc_info.value).lower() or "at least" in str(exc_info.value).lower()


def test_validate_ir_rejects_wrong_node_type():
    """Layout node with invalid type raises."""
    invalid = {
        "version": "1.0",
        "screens": [
            {
                "id": "s1",
                "name": "Main",
                "layout": {
                    "id": "root",
                    "type": "InvalidType",
                    "props": {},
                    "style": {},
                },
            },
        ],
        "navigation": {"type": "stack", "initialScreen": "s1"},
        "theme": {},
    }
    with pytest.raises(IRValidationError):
        validate_ir(invalid)


def test_validate_ir_rejects_missing_navigation():
    """Missing navigation raises."""
    invalid = {
        "version": "1.0",
        "screens": [
            {
                "id": "s1",
                "name": "Main",
                "layout": {"id": "root", "type": "View", "props": {}, "style": {}},
            },
        ],
        "theme": {},
    }
    with pytest.raises(IRValidationError):
        validate_ir(invalid)


def test_validate_ir_returns_serializable_dict():
    """Validated result is JSON-serializable (for storage/API)."""
    data = _sample_ir()
    result = validate_ir(data)
    # Should not raise
    json_str = json.dumps(result)
    assert "1.0" in json_str and "screen_home" in json_str
