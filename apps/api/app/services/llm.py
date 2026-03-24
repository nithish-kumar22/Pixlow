"""OpenRouter LLM integration for IR generation and structured agent artifacts."""
import json
import logging
import os
import re
from typing import Any

from openai import OpenAI

from app.prompt.system_prompt import build_system_prompt, format_user_message
from app.schemas.ir import IRValidationError, validate_ir

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"
MAX_JSON_RETRIES = 2
MAX_VALIDATION_RETRIES = 2


class LLMGenerationError(Exception):
    """Raised when LLM call or response handling fails (rate limit, timeout, invalid output)."""

    pass


def _get_client() -> OpenAI:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise LLMGenerationError("OPENROUTER_API_KEY is not set")
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
    )


def _get_model_id() -> str:
    return os.environ.get("OPENROUTER_MODEL_ID", DEFAULT_MODEL)


def _strip_markdown_code_blocks(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences from LLM response."""
    text = text.strip()
    # Match ```json ... ``` or ``` ... ```
    for pattern in [r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", r"^```\s*\n?(.*?)\n?```\s*$"]:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            return m.group(1).strip()
    return text


def _parse_json_from_response(content: str) -> dict[str, Any]:
    """Extract JSON from response text; strip code blocks. Raises ValueError on parse failure."""
    cleaned = _strip_markdown_code_blocks(content)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}") from e


def _call_llm(client: OpenAI, model_id: str, system_prompt: str, user_message: str) -> str:
    """Call OpenRouter chat completions; return assistant content. Raises LLMGenerationError on API errors."""
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
    except Exception as e:
        logger.warning("OpenRouter API error: %s", e, exc_info=True)
        if "rate" in str(e).lower() or "429" in str(e):
            raise LLMGenerationError("Generation service is busy; please try again shortly.") from e
        if "timeout" in str(e).lower():
            raise LLMGenerationError("Generation timed out; please try again.") from e
        if "401" in str(e) or "unauthorized" in str(e).lower():
            raise LLMGenerationError("Generation service configuration error.") from e
        raise LLMGenerationError("Generation service temporarily unavailable; please try again.") from e

    choice = response.choices[0] if response.choices else None
    if not choice or not getattr(choice, "message", None):
        raise LLMGenerationError("Empty response from generation service.")
    content = (choice.message.content or "").strip()
    if not content:
        raise LLMGenerationError("Empty response from generation service.")
    return content


def _generate_json_with_retries(
    *,
    client: OpenAI,
    model_id: str,
    system_prompt: str,
    user_message: str,
) -> dict[str, Any]:
    current_user_message = user_message
    parsed = None
    for parse_attempt in range(MAX_JSON_RETRIES):
        content = _call_llm(client, model_id, system_prompt, current_user_message)
        try:
            parsed = _parse_json_from_response(content)
            break
        except ValueError as e:
            if parse_attempt < MAX_JSON_RETRIES - 1:
                current_user_message = user_message + "\n\nReturn only valid JSON, no markdown or code fences."
                continue
            logger.warning("JSON parse failed after retries: %s", e)
            raise LLMGenerationError("Generated app structure was invalid; please try again or rephrase your prompt.") from e

    assert parsed is not None
    return parsed


def generate_structured_artifact(*, system_prompt: str, user_message: str) -> dict[str, Any]:
    """Generate a structured JSON artifact for an agent step."""
    model_id = _get_model_id()
    client = _get_client()
    return _generate_json_with_retries(
        client=client,
        model_id=model_id,
        system_prompt=system_prompt,
        user_message=user_message,
    )


def generate_ir(prompt: str, platform: str, context_sections: list[str] | None = None) -> dict[str, Any]:
    """
    Call OpenRouter with system + user prompt; parse and validate response to AppIR.
    Retries once on JSON parse failure (with "Return only valid JSON" hint) and
    once on validation failure (with validation error in user message).
    Returns validated IR dict. Raises LLMGenerationError or IRValidationError on failure.
    """
    model_id = _get_model_id()
    client = _get_client()
    system_prompt = build_system_prompt(platform, include_example=True)
    user_message = format_user_message(prompt, platform)
    if context_sections:
        user_message = user_message + "\n\nAdditional implementation context:\n" + "\n\n".join(context_sections)

    parsed = _generate_json_with_retries(
        client=client,
        model_id=model_id,
        system_prompt=system_prompt,
        user_message=user_message,
    )
    current_user_message = user_message

    # Validate: up to 2 attempts (initial + 1 retry with validation error in user message)
    for validation_attempt in range(MAX_VALIDATION_RETRIES):
        try:
            return validate_ir(parsed)
        except IRValidationError as e:
            if validation_attempt < MAX_VALIDATION_RETRIES - 1:
                current_user_message = current_user_message + f"\n\nThe previous response had invalid structure: {e}. Return valid JSON that conforms to the schema."
                content = _call_llm(client, model_id, system_prompt, current_user_message)
                try:
                    parsed = _parse_json_from_response(content)
                except ValueError:
                    raise LLMGenerationError("Generated app structure was invalid; please try again or rephrase your prompt.") from e
                continue
            logger.warning("IR validation failed after retries: %s", e)
            raise LLMGenerationError("Generated app structure was invalid; please try again or rephrase your prompt.") from e

    raise LLMGenerationError("Generated app structure was invalid; please try again or rephrase your prompt.")
