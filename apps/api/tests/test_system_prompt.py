"""Unit tests for system prompt builder and catalog (M08)."""
from app.prompt.system_prompt import (
    build_system_prompt,
    format_user_message,
    get_catalog_for_prompt,
    get_sample_ir,
)


def test_build_system_prompt_contains_schema_summary():
    prompt = build_system_prompt("react-native", include_example=False)
    assert "version" in prompt and "screens" in prompt
    assert "layout nodes" in prompt
    assert "View" in prompt and "Text" in prompt and "Button" in prompt


def test_build_system_prompt_contains_design_rules():
    prompt = build_system_prompt("react-native", include_example=False)
    assert "Design rules" in prompt or "root layout node" in prompt
    assert "unique string id" in prompt


def test_build_system_prompt_contains_catalog():
    prompt = build_system_prompt("react-native", include_example=False)
    assert "View" in prompt and "Container for layout" in prompt
    assert "Button" in prompt and "Tappable button" in prompt
    assert "You can use only the following components" in prompt


def test_build_system_prompt_with_example_includes_sample_ir():
    prompt = build_system_prompt("react-native", include_example=True)
    assert "Example structure" in prompt
    sample = get_sample_ir()
    assert sample["version"] == "1.0"
    assert "screen_home" in prompt
    assert '"navigation"' in prompt


def test_build_system_prompt_without_example_omits_sample():
    with_example = build_system_prompt("react-native", include_example=True)
    without_example = build_system_prompt("react-native", include_example=False)
    assert "Example structure" not in without_example
    assert len(without_example) < len(with_example)


def test_format_user_message_trims_and_prefixes():
    result = format_user_message("  A to-do app with a list  ", "react-native")
    assert result.startswith("Target platform: React Native.")
    assert "Generate a mobile app with the following description" in result
    assert "A to-do app with a list" in result
    assert not result.startswith("  ")


def test_format_user_message_react_native_label():
    result = format_user_message("Hello", "react-native")
    assert "React Native" in result


def test_get_sample_ir_valid_structure():
    sample = get_sample_ir()
    assert sample["version"] == "1.0"
    assert len(sample["screens"]) >= 1
    assert sample["screens"][0]["layout"]["type"] == "View"
    assert sample["navigation"]["initialScreen"] == "screen_home"


def test_get_catalog_for_prompt_includes_components():
    catalog_text = get_catalog_for_prompt("react-native")
    assert "View" in catalog_text
    assert "Text" in catalog_text
    assert "Button" in catalog_text
    assert "FlatList" in catalog_text
    assert "SafeAreaView" in catalog_text
