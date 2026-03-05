"""Unit tests for LLM generate_ir (M08) with mocked OpenRouter."""
import json
import os
from unittest.mock import MagicMock, patch

import pytest

from app.prompt.system_prompt import get_sample_ir
from app.services.llm import LLMGenerationError, generate_ir


def _make_completion(content: str) -> MagicMock:
    choice = MagicMock()
    choice.message.content = content
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
@patch("app.services.llm.OpenAI")
def test_generate_ir_returns_validated_ir(mock_openai_class):
    """Mock OpenRouter to return valid JSON; generate_ir returns validated dict."""
    sample = get_sample_ir()
    mock_client = MagicMock()
    mock_openai_class.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_completion(json.dumps(sample))

    result = generate_ir("A todo app with a list", "react-native")

    assert result["version"] == "1.0"
    assert len(result["screens"]) >= 1
    assert result["navigation"]["initialScreen"] == "screen_home"
    mock_client.chat.completions.create.assert_called_once()


@patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
@patch("app.services.llm.OpenAI")
def test_generate_ir_strips_markdown_fences(mock_openai_class):
    """When LLM returns JSON wrapped in ```json ... ```, parse succeeds."""
    sample = get_sample_ir()
    wrapped = "```json\n" + json.dumps(sample) + "\n```"
    mock_client = MagicMock()
    mock_openai_class.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_completion(wrapped)

    result = generate_ir("A simple app", "react-native")

    assert result["version"] == "1.0"
    mock_client.chat.completions.create.assert_called_once()


@patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
@patch("app.services.llm.OpenAI")
def test_generate_ir_retries_on_invalid_json(mock_openai_class):
    """First response invalid JSON, second valid; one retry and success."""
    sample = get_sample_ir()
    mock_client = MagicMock()
    mock_openai_class.return_value = mock_client
    mock_client.chat.completions.create.side_effect = [
        _make_completion("not valid json at all"),
        _make_completion(json.dumps(sample)),
    ]

    result = generate_ir("A simple app", "react-native")

    assert result["version"] == "1.0"
    assert mock_client.chat.completions.create.call_count == 2


def test_generate_ir_raises_when_api_key_missing():
    """When OPENROUTER_API_KEY is missing, raise clear error."""
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": ""}, clear=False):
        with pytest.raises(LLMGenerationError) as exc_info:
            generate_ir("A simple app", "react-native")
        assert "OPENROUTER_API_KEY" in str(exc_info.value)
