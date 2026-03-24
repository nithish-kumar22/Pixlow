"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LayoutNode, AppIR } from "@pixlow/ir";
import { useIRStore } from "@/stores/irStore";
import { useBuilderStore } from "@/stores/builderStore";
import {
  getChildren,
  getNodeById,
  updateNodeById,
  CAN_HAVE_CHILDREN,
} from "@/lib/irCanvas/irTreeOps";

type InspectorTab = "style" | "layout" | "data";

function PropertyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: "var(--builder-text-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded border px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--builder-accent)]";
const inputStyle = {
  borderColor: "var(--builder-border)",
  backgroundColor: "var(--builder-bg)",
  color: "var(--builder-text)",
} as const;

function LayersRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: LayoutNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const children = getChildren(node);
  const selected = node.id === selectedId;
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
        style={{
          paddingLeft: 8 + depth * 12,
          backgroundColor: selected ? "var(--builder-surface-elevated)" : "transparent",
          color: selected ? "var(--builder-accent)" : "var(--builder-text)",
        }}
      >
        <span className="font-medium">{node.type}</span>
      </button>
      {children.map((c) => (
        <LayersRow key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function NodeInspector() {
  const { ir, setIR } = useIRStore();
  const activeScreenId = useBuilderStore((s) => s.activeScreenId);
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);
  const [tab, setTab] = useState<InspectorTab>("style");

  const activeScreen = useMemo(() => {
    if (!ir || ir.screens.length === 0) return null;
    const id =
      activeScreenId && ir.screens.some((s) => s.id === activeScreenId)
        ? activeScreenId
        : ir.screens[0]!.id;
    return ir.screens.find((s) => s.id === id) ?? null;
  }, [ir, activeScreenId]);

  const effectiveSelectedId = useMemo(() => {
    if (!activeScreen) return null;
    if (selectedNodeId && getNodeById(activeScreen.layout, selectedNodeId)) return selectedNodeId;
    return activeScreen.layout.id;
  }, [activeScreen, selectedNodeId]);

  const selectedNode = useMemo(() => {
    if (!activeScreen || !effectiveSelectedId) return null;
    return getNodeById(activeScreen.layout, effectiveSelectedId);
  }, [activeScreen, effectiveSelectedId]);

  const updateLayout = (updater: (layout: LayoutNode) => LayoutNode) => {
    if (!ir || !activeScreen) return;
    const nextScreens = ir.screens.map((s) =>
      s.id === activeScreen.id ? { ...s, layout: updater(s.layout) } : s
    );
    setIR({ ...ir, screens: nextScreens }, { recordHistory: true });
  };

  const setSelectedNodeField = (updater: (node: LayoutNode) => LayoutNode) => {
    if (!activeScreen || !effectiveSelectedId) return;
    updateLayout((layout) => updateNodeById(layout, effectiveSelectedId, updater));
  };

  const getPropString = (key: string, fallback: string) => {
    const v = selectedNode?.props?.[key];
    return typeof v === "string" ? v : fallback;
  };

  const getStyleString = (key: string, fallback: string) => {
    const v = selectedNode?.style?.[key];
    return typeof v === "string" ? v : fallback;
  };

  const getStyleNumber = (key: string, fallback: number) => {
    const v = selectedNode?.style?.[key];
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  if (!ir || !activeScreen) {
    return (
      <div className="p-3 text-xs" style={{ color: "var(--builder-text-muted)" }}>
        Load or generate an app to inspect nodes.
      </div>
    );
  }

  const tabBtn = (id: InspectorTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: tab === id ? "var(--builder-surface-elevated)" : "transparent",
        color: tab === id ? "var(--builder-text)" : "var(--builder-text-muted)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3">
      <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--builder-bg)" }}>
        {tabBtn("style", "Style")}
        {tabBtn("layout", "Layout")}
        {tabBtn("data", "Data")}
      </div>

      {!selectedNode ? (
        <p className="text-xs" style={{ color: "var(--builder-text-muted)" }}>
          Select a node in the canvas or layers.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div
            className="rounded border px-2 py-2 text-xs"
            style={{ borderColor: "var(--builder-border)", color: "var(--builder-text-muted)" }}
          >
            <span className="font-medium" style={{ color: "var(--builder-text)" }}>
              {selectedNode.type}
            </span>
          </div>

          {tab === "layout" && (
            <div className="flex flex-col gap-3">
              <PropertyField label="Width">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={String(selectedNode.style?.width ?? "")}
                  placeholder="auto"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    setSelectedNodeField((n) => ({
                      ...n,
                      style: {
                        ...(n.style ?? {}),
                        ...(raw === "" ? { width: undefined } : { width: /^\d+$/.test(raw) ? Number(raw) : raw }),
                      },
                    }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Height">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={String(selectedNode.style?.height ?? "")}
                  placeholder="auto"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    setSelectedNodeField((n) => ({
                      ...n,
                      style: {
                        ...(n.style ?? {}),
                        ...(raw === "" ? { height: undefined } : { height: /^\d+$/.test(raw) ? Number(raw) : raw }),
                      },
                    }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Padding">
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  value={getStyleNumber("padding", 0)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), padding: v } }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Radius">
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  value={getStyleNumber("borderRadius", 0)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), borderRadius: v } }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Flex">
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  value={getStyleNumber("flex", 0)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), flex: v } }));
                  }}
                />
              </PropertyField>
            </div>
          )}

          {tab === "style" && (
            <div className="flex flex-col gap-3">
              <PropertyField label="Background">
                <input
                  type="color"
                  className={`${inputClass} h-9`}
                  style={inputStyle}
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(getStyleString("backgroundColor", "#ffffff"))
                      ? getStyleString("backgroundColor", "#ffffff")
                      : "#6366f1"
                  }
                  onChange={(e) => {
                    setSelectedNodeField((n) => ({
                      ...n,
                      style: { ...(n.style ?? {}), backgroundColor: e.target.value },
                    }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Opacity">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                  value={getStyleNumber("opacity", 1)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), opacity: v } }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Border width">
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  value={getStyleNumber("borderWidth", 0)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), borderWidth: v } }));
                  }}
                />
              </PropertyField>
              <PropertyField label="Border color">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={getStyleString("borderColor", "#000000")}
                  onChange={(e) => {
                    setSelectedNodeField((n) => ({
                      ...n,
                      style: { ...(n.style ?? {}), borderColor: e.target.value },
                    }));
                  }}
                />
              </PropertyField>
            </div>
          )}

          {tab === "data" && (
            <div className="flex flex-col gap-3">
              {selectedNode.type === "Text" && (
                <>
                  <PropertyField label="Content">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={getPropString("content", "")}
                      onChange={(e) =>
                        setSelectedNodeField((n) => ({
                          ...n,
                          props: { ...(n.props ?? {}), content: e.target.value },
                        }))
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Font size">
                    <input
                      type="number"
                      className={inputClass}
                      style={inputStyle}
                      value={getStyleNumber("fontSize", 16)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSelectedNodeField((n) => ({ ...n, style: { ...(n.style ?? {}), fontSize: v } }));
                      }}
                    />
                  </PropertyField>
                  <PropertyField label="Font weight">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={getStyleString("fontWeight", "bold")}
                      onChange={(e) => {
                        setSelectedNodeField((n) => ({
                          ...n,
                          style: { ...(n.style ?? {}), fontWeight: e.target.value },
                        }));
                      }}
                    />
                  </PropertyField>
                </>
              )}
              {selectedNode.type === "Button" && (
                <>
                  <PropertyField label="Label">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={getPropString("label", "")}
                      onChange={(e) =>
                        setSelectedNodeField((n) => ({
                          ...n,
                          props: { ...(n.props ?? {}), label: e.target.value },
                        }))
                      }
                    />
                  </PropertyField>
                </>
              )}
              {selectedNode.type === "TextInput" && (
                <>
                  <PropertyField label="Placeholder">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={getPropString("placeholder", "")}
                      onChange={(e) =>
                        setSelectedNodeField((n) => ({
                          ...n,
                          props: { ...(n.props ?? {}), placeholder: e.target.value },
                        }))
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Value">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={getPropString("value", "")}
                      onChange={(e) =>
                        setSelectedNodeField((n) => ({
                          ...n,
                          props: { ...(n.props ?? {}), value: e.target.value },
                        }))
                      }
                    />
                  </PropertyField>
                </>
              )}
              {selectedNode.type === "Image" && (
                <PropertyField label="Source URL">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={getPropString("source", "")}
                    onChange={(e) =>
                      setSelectedNodeField((n) => ({
                        ...n,
                        props: { ...(n.props ?? {}), source: e.target.value },
                      }))
                    }
                  />
                </PropertyField>
              )}
              <div className="text-[11px]" style={{ color: "var(--builder-text-muted)" }}>
                Events:{" "}
                {selectedNode.events && Object.keys(selectedNode.events).length > 0
                  ? Object.keys(selectedNode.events).join(", ")
                  : "None"}
              </div>
            </div>
          )}

          {/* Type-specific fields also in style tab for nodes not covered above */}
          {tab === "style" &&
            (selectedNode.type === "Text" ||
              selectedNode.type === "Button" ||
              selectedNode.type === "TextInput") && (
              <p className="text-[11px]" style={{ color: "var(--builder-text-muted)" }}>
                Use the Data tab for text, labels, and inputs. Use Layout for padding and radius.
              </p>
            )}
        </div>
      )}

      <div className="border-t pt-3" style={{ borderColor: "var(--builder-border)" }}>
        <div className="mb-2 text-xs font-semibold" style={{ color: "var(--builder-text)" }}>
          Layers
        </div>
        <div
          className="max-h-40 overflow-y-auto rounded border p-1"
          style={{ borderColor: "var(--builder-border)" }}
        >
          <LayersRow
            node={activeScreen.layout}
            depth={0}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedNodeId}
          />
        </div>
      </div>
    </div>
  );
}
