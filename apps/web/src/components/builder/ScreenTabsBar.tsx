"use client";

import { useMemo } from "react";
import type { AppIR } from "@pixlow/ir";
import { useIRStore } from "@/stores/irStore";
import { useBuilderStore } from "@/stores/builderStore";
import { randomId } from "@/lib/irCanvas/irTreeOps";
import { ensureValidIRForCanvas } from "@/lib/irCanvas/canvasToIR";

export function ScreenTabsBar() {
  const { ir, setIR } = useIRStore();
  const activeScreenId = useBuilderStore((s) => s.activeScreenId);
  const setActiveScreenId = useBuilderStore((s) => s.setActiveScreenId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);

  const effectiveId = useMemo(() => {
    if (!ir || ir.screens.length === 0) return null;
    if (activeScreenId && ir.screens.some((s) => s.id === activeScreenId)) return activeScreenId;
    return ir.screens[0]!.id;
  }, [ir, activeScreenId]);

  if (!ir || ir.screens.length === 0) return null;

  const addScreen = () => {
    const nextIndex = ir.screens.length + 1;
    const newScreenId = randomId(`screen_${nextIndex}`);
    const newRootId = randomId("root");
    const newScreen = {
      id: newScreenId,
      name: `Screen ${nextIndex}`,
      layout: {
        id: newRootId,
        type: "View" as const,
        props: {},
        style: { flex: 1, padding: 16, backgroundColor: "#ffffff" },
        children: [],
      },
    };
    const nextIr: AppIR = {
      ...ir,
      screens: [...ir.screens, newScreen],
      navigation: {
        ...ir.navigation,
        initialScreen: newScreenId,
      },
    };
    setIR(ensureValidIRForCanvas(nextIr), { recordHistory: true });
    setActiveScreenId(newScreenId);
    setSelectedNodeId(newRootId);
  };

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
      style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
    >
      <div className="flex flex-wrap gap-1">
        {ir.screens.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveScreenId(s.id);
              setIR(
                {
                  ...ir,
                  navigation: { ...ir.navigation, initialScreen: s.id },
                },
                { recordHistory: false }
              );
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: s.id === effectiveId ? "var(--builder-accent)" : "transparent",
              color: s.id === effectiveId ? "#fff" : "var(--builder-text-muted)",
            }}
          >
            {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addScreen}
          className="rounded-md px-2 py-1.5 text-xs font-medium"
          style={{ color: "var(--builder-accent)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
