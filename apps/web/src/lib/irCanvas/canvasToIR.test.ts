import { describe, it, expect } from "vitest";
import { validateIR } from "@pixlow/ir";
import { getBlankIR } from "./getBlankIR";
import { ensureValidIRForCanvas } from "./canvasToIR";

describe("irCanvas helpers", () => {
  it("getBlankIR returns valid AppIR", () => {
    const ir = getBlankIR();
    expect(() => validateIR(ir)).not.toThrow();
  });

  it("ensureValidIRForCanvas normalizes missing props/style/children", () => {
    const ir = getBlankIR();
    // Break a minimal set of invariants as a canvas might do while editing.
    const layout = ir.screens[0].layout as unknown as {
      props?: unknown;
      style?: unknown;
      children?: unknown;
    };
    layout.props = null;
    layout.style = undefined;
    layout.children = undefined;

    const normalized = ensureValidIRForCanvas(ir);
    expect(() => validateIR(normalized)).not.toThrow();
    expect(normalized.screens[0].layout.props).toBeDefined();
    expect(normalized.screens[0].layout.style).toBeDefined();
  });
});

