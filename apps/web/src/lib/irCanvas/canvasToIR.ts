import { validateIR, type AppIR, type LayoutNode } from "@pixlow/ir";

function ensureRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeLayoutNode(node: LayoutNode): LayoutNode {
  const normalized: LayoutNode = {
    ...node,
    props: ensureRecord((node as unknown as { props?: unknown }).props),
    style: ensureRecord((node as unknown as { style?: unknown }).style),
  };

  const children = (node as unknown as { children?: unknown }).children;
  if (children === null || children === undefined) {
    normalized.children = children;
  } else if (Array.isArray(children)) {
    normalized.children = (children as unknown[]).map((c) => normalizeLayoutNode(c as LayoutNode));
  } else {
    normalized.children = [];
  }

  const events = (node as unknown as { events?: unknown }).events;
  if (events === undefined || events === null) {
    normalized.events = events;
  }

  return normalized;
}

/**
 * Canvas --> IR normalization/validation.
 * The canvas mutates `AppIR`; this function makes sure that what it produces
 * is still a valid `AppIR` for compilation and preview.
 */
export function ensureValidIRForCanvas(ir: AppIR): AppIR {
  const normalized: AppIR = {
    ...ir,
    screens: ir.screens.map((screen) => ({
      ...screen,
      layout: normalizeLayoutNode(screen.layout),
    })),
    theme: ir.theme ?? {},
    dataBindings: ir.dataBindings ?? {},
    assets: ir.assets ?? [],
  };

  return validateIR(normalized);
}

/**
 * Alias used in plan wording.
 * Prefer `ensureValidIRForCanvas` in new code.
 */
export function canvasToIR(ir: AppIR): AppIR {
  return ensureValidIRForCanvas(ir);
}

