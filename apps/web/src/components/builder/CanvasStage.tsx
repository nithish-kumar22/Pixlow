"use client";

import type { ReactNode } from "react";
import { useBuilderStore } from "@/stores/builderStore";

type CanvasStageProps = {
  children: ReactNode;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function CanvasStage({ children, canUndo, canRedo, onUndo, onRedo }: CanvasStageProps) {
  const canvasZoom = useBuilderStore((s) => s.canvasZoom);
  const setCanvasZoom = useBuilderStore((s) => s.setCanvasZoom);
  const showCanvasGrid = useBuilderStore((s) => s.showCanvasGrid);
  const setShowCanvasGrid = useBuilderStore((s) => s.setShowCanvasGrid);
  const devicePreset = useBuilderStore((s) => s.devicePreset);
  const setDevicePreset = useBuilderStore((s) => s.setDevicePreset);

  const maxW =
    devicePreset === "mobile"
      ? "min(100%, 390px)"
      : devicePreset === "tablet"
        ? "min(100%, 768px)"
        : "min(100%, 1024px)";

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
      style={{
        borderColor: "var(--builder-border)",
        backgroundColor: "var(--builder-bg)",
        backgroundImage: showCanvasGrid
          ? "radial-gradient(circle, var(--builder-border) 1px, transparent 1px)"
          : undefined,
        backgroundSize: showCanvasGrid ? "20px 20px" : undefined,
      }}
    >
      <div
        className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border px-2 py-1 shadow-lg"
        style={{
          borderColor: "var(--builder-border)",
          backgroundColor: "var(--builder-surface)",
        }}
      >
        <button
          type="button"
          className="rounded p-1.5 text-xs"
          style={{ color: "var(--builder-accent)" }}
          title="Select"
          aria-label="Select"
        >
          ↖
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-xs disabled:opacity-40"
          style={{ color: "var(--builder-text-muted)" }}
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-xs disabled:opacity-40"
          style={{ color: "var(--builder-text-muted)" }}
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
        >
          Redo
        </button>
        <span className="px-2 text-[11px] tabular-nums" style={{ color: "var(--builder-text-muted)" }}>
          {Math.round(canvasZoom * 100)}%
        </span>
        <button
          type="button"
          className="text-[11px] px-1"
          style={{ color: "var(--builder-text-muted)" }}
          onClick={() => setCanvasZoom(canvasZoom - 0.1)}
        >
          −
        </button>
        <button
          type="button"
          className="text-[11px] px-1"
          style={{ color: "var(--builder-text-muted)" }}
          onClick={() => setCanvasZoom(canvasZoom + 0.1)}
        >
          +
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[11px]"
          style={{
            color: "var(--builder-text-muted)",
            backgroundColor: showCanvasGrid ? "var(--builder-surface-elevated)" : "transparent",
          }}
          onClick={() => setShowCanvasGrid(!showCanvasGrid)}
        >
          Grid
        </button>
      </div>

      <div
        className="absolute right-3 top-14 z-10 flex flex-col gap-1 rounded-lg border p-1"
        style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
      >
        {(["mobile", "tablet", "desktop"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevicePreset(d)}
            className="rounded px-2 py-1 text-[10px] font-medium capitalize"
            style={{
              backgroundColor: devicePreset === d ? "var(--builder-accent)" : "transparent",
              color: devicePreset === d ? "#fff" : "var(--builder-text-muted)",
            }}
          >
            {d === "mobile" ? "Phone" : d}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-8 pt-16">
        <div
          style={{
            transform: `scale(${canvasZoom})`,
            transformOrigin: "center center",
            maxWidth: maxW,
            width: "100%",
          }}
        >
          <div
            className="flex flex-col overflow-hidden rounded-[2rem] border-[10px] shadow-2xl"
            style={{
              borderColor: "#0a0a0c",
              backgroundColor: "#0a0a0c",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
              aspectRatio: devicePreset === "mobile" ? "9 / 19" : devicePreset === "tablet" ? "3 / 4" : "16 / 10",
              minHeight: devicePreset === "desktop" ? 360 : 520,
            }}
          >
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem]"
              style={{ backgroundColor: "var(--builder-surface)" }}
            >
              {devicePreset === "mobile" ? (
                <>
                  <div
                    className="relative shrink-0 bg-[#0a0a0c] pt-2"
                    aria-hidden
                  >
                    <div
                      className="pointer-events-none absolute left-1/2 top-2 z-10 h-7 w-[118px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10"
                    />
                    <div className="relative z-0 flex items-center justify-between px-5 pb-2 pt-1 text-[11px] font-semibold tabular-nums text-white/95">
                      <span>9:41</span>
                      <span className="flex items-center gap-1.5 opacity-90">
                        <span className="text-[9px] tracking-tighter">▮▮▮</span>
                        <span className="text-[10px]">▮</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
                </>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
