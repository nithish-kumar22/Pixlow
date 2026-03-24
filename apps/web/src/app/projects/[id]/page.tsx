"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { GenerationRun } from "@/lib/generation";
import type { AppIR } from "@pixlow/ir";
import { validateIR } from "@pixlow/ir";
import { useAuth } from "@/contexts/AuthContext";
import { getProject } from "@/lib/projects";
import { getVersion, createVersion } from "@/lib/versions";
import { getBlankIR } from "@/lib/irCanvas/getBlankIR";
import { useIRStore, useCanUndo, useCanRedo } from "@/stores/irStore";
import { useBuilderStore, type WorkspaceTab } from "@/stores/builderStore";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { BuilderLayout } from "@/components/builder/BuilderLayout";
import { CanvasStage } from "@/components/builder/CanvasStage";
import { ScreenTabsBar } from "@/components/builder/ScreenTabsBar";
import { NodeInspector } from "@/components/builder/NodeInspector";
import { PromptSessionPanel } from "@/components/builder/PromptSessionPanel";
import { CanvasEditor } from "@/components/editor/CanvasEditor";
import { Preview } from "@/components/preview";
import { CodeView } from "@/components/editor/CodeView";
import { VersionList } from "@/components/versions";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = String((params as { id?: string }).id ?? "");
  const { getToken } = useAuth();
  const { ir, setIR, clearIR, undo, redo } = useIRStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const workspaceTab = useBuilderStore((s) => s.workspaceTab);
  const setWorkspaceTab = useBuilderStore((s) => s.setWorkspaceTab);
  const historyPanelOpen = useBuilderStore((s) => s.historyPanelOpen);
  const setActiveScreenId = useBuilderStore((s) => s.setActiveScreenId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);
  const resetBuilder = useBuilderStore((s) => s.reset);

  const [projectName, setProjectName] = useState<string>("Project");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<GenerationRun | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const platformIr = useMemo(() => ir, [ir]);

  useEffect(() => {
    resetBuilder();
  }, [projectId, resetBuilder]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      clearIR();
      try {
        const tokenGetter = getToken;
        const token = await tokenGetter();
        if (!token) throw new Error("Not signed in");

        const project = await getProject(projectId, tokenGetter);
        if (cancelled) return;
        setProjectName(project.name);

        if (project.head_version_id) {
          const version = await getVersion(project.head_version_id, tokenGetter);
          const validated: AppIR = validateIR(version.ir_snapshot);
          if (cancelled) return;
          setIR(validated);
        } else {
          const blank = getBlankIR();
          if (cancelled) return;
          setIR(blank);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (cancelled) return;
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, getToken, setIR, clearIR]);

  useEffect(() => {
    if (!ir?.screens?.length) return;
    const first = ir.screens[0]!;
    const state = useBuilderStore.getState();
    if (!state.activeScreenId || !ir.screens.some((s) => s.id === state.activeScreenId)) {
      setActiveScreenId(first.id);
      setSelectedNodeId(first.layout.id);
    }
  }, [ir, setActiveScreenId, setSelectedNodeId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable=true]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" || e.key === "Z") {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const handleGenerateSuccess = useCallback(
    (result: { ir: AppIR; versionId?: string; savedAt?: string }) => {
      setRun(null);
      setIR(result.ir);
      if (result.savedAt) setLastSavedAt(result.savedAt);
      const first = result.ir.screens[0];
      if (first) {
        setActiveScreenId(first.id);
        setSelectedNodeId(first.layout.id);
      }
    },
    [setIR, setActiveScreenId, setSelectedNodeId]
  );

  const handleSave = useCallback(async () => {
    if (!ir) return;
    if (!projectId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createVersion(projectId, ir, "Saved from canvas", getToken);
      setLastSavedAt(created.created_at);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [ir, projectId, getToken]);

  const workspaceTabBtn = (id: WorkspaceTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={workspaceTab === id}
      onClick={() => setWorkspaceTab(id)}
      className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: workspaceTab === id ? "var(--builder-accent)" : "transparent",
        color: workspaceTab === id ? "#fff" : "var(--builder-text-muted)",
      }}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center p-6">
        <div
          className="size-8 animate-spin rounded-full border-2"
          style={{
            borderColor: "var(--builder-border)",
            borderTopColor: "var(--builder-accent)",
          }}
          aria-hidden
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="rounded-lg border p-4 text-sm"
          style={{
            borderColor: "var(--preview-error-border)",
            backgroundColor: "var(--preview-error-bg)",
            color: "var(--preview-error-text)",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BuilderTopBar
        projectName={projectName}
        lastSavedAt={lastSavedAt}
        saving={saving}
        onPublish={handleSave}
        publishDisabled={!ir}
      />

      {historyPanelOpen && (
        <div
          className="max-h-56 shrink-0 overflow-y-auto border-b px-4 py-3"
          style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-bg)" }}
        >
          <VersionList
            variant="builder"
            projectId={projectId}
            onRestored={() => {
              setLastSavedAt(null);
            }}
          />
        </div>
      )}

      <BuilderLayout
        left={
          <PromptSessionPanel
            projectId={projectId}
            run={run}
            onGenerateSuccess={handleGenerateSuccess}
            onRunUpdate={(r) => setRun(r)}
            onError={setError}
          />
        }
        center={
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className="flex shrink-0 flex-wrap gap-1 border-b px-3 py-2"
              style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
              role="tablist"
              aria-label="Workspace"
            >
              {workspaceTabBtn("canvas", "Canvas")}
              {workspaceTabBtn("preview", "Preview")}
              {workspaceTabBtn("code", "Code")}
            </div>
            <ScreenTabsBar />
            <div className="min-h-0 flex-1 p-2">
              {workspaceTab === "code" ? (
                <div
                  className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-bg)" }}
                >
                  <CodeView ir={platformIr} variant="builder" className="min-h-0 flex-1" />
                </div>
              ) : (
                <CanvasStage canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}>
                  {workspaceTab === "canvas" ? (
                    <CanvasEditor />
                  ) : (
                    <div className="flex h-full min-h-0 flex-1 flex-col">
                      <Preview ir={platformIr} variant="builder" className="flex min-h-0 flex-1 flex-col" />
                    </div>
                  )}
                </CanvasStage>
              )}
            </div>
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col">
            <NodeInspector />
          </div>
        }
      />
    </div>
  );
}
