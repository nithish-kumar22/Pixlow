"""System prompt builder and component catalog (port of M07)."""
import json

# --- Constants (aligned with packages/ir/src/prompt/buildSystemPrompt.ts) ---

IR_SCHEMA_SUMMARY = """Output JSON must have this shape:
- version (string), appId? (string)
- screens: array of { id (string), name (string), layout (single root node) }
- layout nodes: id (string), type (string, one of View, Text, Image, Button, TextInput, FlatList, ScrollView, SafeAreaView), props (object), style (object), children? (array of nodes), events? (e.g. onPress: { action, target? })
- navigation: { type: 'stack' | 'tabs', initialScreen (screen id) }
- theme: { primaryColor?, fontFamily? }
- dataBindings? (object), assets? (array)"""

DESIGN_RULES = """Design rules:
- Each screen has exactly one root layout node (typically View or SafeAreaView).
- Every screen and every layout node must have a unique string id.
- Use only component types listed in the component catalog below.
- navigation.initialScreen must be the id of one of the screens."""

ROLE_AND_FORMAT = """You are a mobile app generator that outputs a single JSON object representing the app structure (Intermediate Representation). Respond with ONLY valid JSON. No markdown, no code fences, no explanation before or after."""

# --- React Native component catalog (port of packages/ir/src/catalog/catalogReactNative.ts) ---

CATALOG_REACT_NATIVE = [
    {
        "id": "View",
        "name": "View",
        "description": "Container for layout and grouping other components.",
        "category": "layout",
        "props": [],
        "styleProps": [
            "flex", "flexDirection", "justifyContent", "alignItems", "gap",
            "padding", "paddingHorizontal", "paddingVertical",
            "margin", "marginHorizontal", "marginVertical",
            "backgroundColor", "borderRadius",
        ],
    },
    {
        "id": "Text",
        "name": "Text",
        "description": "Displays read-only text content.",
        "category": "content",
        "props": [{"name": "content", "type": "string"}, {"name": "numberOfLines", "type": "number", "default": 0}],
        "styleProps": ["fontSize", "fontWeight", "color", "textAlign", "margin", "marginBottom", "marginTop"],
    },
    {
        "id": "Image",
        "name": "Image",
        "description": "Displays an image from a URI or local asset.",
        "category": "content",
        "props": [{"name": "source", "type": "string"}, {"name": "resizeMode", "type": '"cover" | "contain" | "center"', "default": "cover"}],
        "styleProps": ["width", "height", "borderRadius", "margin", "alignSelf"],
    },
    {
        "id": "Button",
        "name": "Button",
        "description": "Tappable button. In IR, use events.onPress with action (e.g. navigate) and optional target.",
        "category": "input",
        "props": [{"name": "label", "type": "string"}, {"name": "disabled", "type": "boolean", "default": False}],
        "styleProps": ["padding", "paddingHorizontal", "paddingVertical", "backgroundColor", "borderRadius", "alignItems", "justifyContent", "marginTop"],
    },
    {
        "id": "TextInput",
        "name": "TextInput",
        "description": "Single-line or multi-line text input.",
        "category": "input",
        "props": [{"name": "placeholder", "type": "string", "default": ""}, {"name": "secureTextEntry", "type": "boolean", "default": False}],
        "styleProps": ["fontSize", "color", "padding", "borderWidth", "borderColor", "borderRadius", "marginVertical"],
    },
    {
        "id": "FlatList",
        "name": "FlatList",
        "description": "Efficiently renders a vertical scrolling list. In IR, children often describe the item layout.",
        "category": "list",
        "props": [{"name": "data", "type": "array"}, {"name": "keyExtractor", "type": "string", "default": "id"}],
        "styleProps": ["flex", "marginTop"],
    },
    {
        "id": "ScrollView",
        "name": "ScrollView",
        "description": "Scroll container for content that might not fit on screen. Wraps other layout and content nodes.",
        "category": "layout",
        "props": [],
        "styleProps": ["flex", "padding", "marginTop"],
    },
    {
        "id": "SafeAreaView",
        "name": "SafeAreaView",
        "description": "Layout container that renders content within the safe area boundaries of a device.",
        "category": "layout",
        "props": [],
        "styleProps": ["flex", "padding", "backgroundColor"],
    },
]

# Sample IR for few-shot example (same structure as packages/ir/sampleIR.json)
SAMPLE_IR = {
    "version": "1.0",
    "appId": "sample-app",
    "screens": [
        {
            "id": "screen_home",
            "name": "Home",
            "layout": {
                "id": "root_home",
                "type": "View",
                "props": {},
                "style": {"flex": 1, "backgroundColor": "#ffffff"},
                "children": [
                    {
                        "id": "text_hello",
                        "type": "Text",
                        "props": {"content": "Hello, World!"},
                        "style": {"fontSize": 24, "fontWeight": "bold"},
                    },
                    {
                        "id": "btn_action",
                        "type": "Button",
                        "props": {"label": "Tap me"},
                        "style": {},
                        "events": {"onPress": {"action": "navigate", "target": "screen_detail"}},
                    },
                ],
            },
        },
    ],
    "navigation": {"type": "stack", "initialScreen": "screen_home"},
    "theme": {"primaryColor": "#6366f1", "fontFamily": "Inter"},
    "dataBindings": {},
    "assets": [],
}


def get_component_catalog(platform: str) -> list[dict]:
    """Return component catalog for the given platform. MVP: only react-native."""
    if platform == "react-native":
        return CATALOG_REACT_NATIVE
    return CATALOG_REACT_NATIVE  # fallback for MVP


def get_catalog_for_prompt(platform: str) -> str:
    """Format catalog as text for inclusion in system prompt (same as getCatalogForPrompt in TS)."""
    catalog = get_component_catalog(platform)
    lines = ["You can use only the following components in IR layout nodes:"]
    for entry in catalog:
        props_str = ", ".join(f"{p['name']}: {p['type']}" for p in entry["props"]) if entry["props"] else "none"
        style_str = ", ".join(entry["styleProps"]) if entry.get("styleProps") else "basic React Native layout / text styles"
        lines.append(f"- {entry['name']} ({entry['id']}) — {entry['description']} | props: {props_str} | style props: {style_str}")
    return "\n".join(lines)


def get_sample_ir() -> dict:
    """Return sample IR for few-shot example (M05 sample)."""
    return SAMPLE_IR


def build_system_prompt(platform: str, *, include_example: bool = True) -> str:
    """
    Build system prompt: role, schema summary, design rules, catalog, optionally sample IR.
    MVP platform is always 'react-native'; signature ready for future 'flutter'.
    """
    sections = [
        ROLE_AND_FORMAT,
        "",
        "JSON schema (required keys and types):",
        IR_SCHEMA_SUMMARY,
        "",
        DESIGN_RULES,
        "",
        get_catalog_for_prompt(platform),
    ]
    if include_example:
        sections.extend([
            "",
            "Example structure (follow this shape):",
            json.dumps(get_sample_ir(), indent=2),
        ])
    return "\n".join(sections)


def format_user_message(prompt: str, platform: str) -> str:
    """
    Format raw user prompt as the user message to the LLM.
    Caller should validate prompt length before calling; this only trims and prefixes.
    """
    trimmed = prompt.strip()
    platform_label = "React Native" if platform == "react-native" else platform
    return f"Target platform: {platform_label}.\n\nGenerate a mobile app with the following description:\n\n{trimmed}"
