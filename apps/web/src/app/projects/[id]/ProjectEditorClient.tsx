"use client";

/**
 * Project editor page (M15/M16/M17). Loads project; IR from Zustand store; prompt (M13), Preview (M11), Code view, History (M16), Export (M17).
 * On load, fetches head version IR when project.head_version_id is set. Shows "Saved" indicator and version list.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { validateIR } from "@pixlow/ir";
import { compileIRToReactNativeSync } from "@pixlow/compiler-rn/sync";
import { PromptPanel, WorkflowPanel } from "@/components/prompt";
import { Preview } from "@/components/preview";
import { CodeView } from "@/components/editor/CodeView";
import { VersionList } from "@/components/versions";
import { useIRStore } from "@/stores/irStore";
import {
  getProject,
  updateProject,
  deleteProject,
  type ProjectResponse,
} from "@/lib/projects";
import { getVersion } from "@/lib/versions";
import type { GenerateResult, GenerationRun } from "@/lib/generation";
import {
  downloadZipFromFileTree,
  buildExportFilename,
} from "@/lib/exportZip";

type Props = {
  projectId: string;
};

type EditorTab = "preview" | "code" | "history";

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ProjectEditorClient({ projectId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { ir, setIR, clearIR } = useIRStore();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("preview");
  const [latestRun, setLatestRun] = useState<GenerationRun | null>(null);

  const handleGenerationSuccess = useCallback(
    (result: GenerateResult) => {
      setIR(result.ir);
      setLastSavedAt(result.savedAt ?? null);
      setLatestRun(result.run ?? null);
    },
    [setIR]
  );

  // Load project; clear IR and lastSavedAt when projectId changes
  useEffect(() => {
    let cancelled = false;
    clearIR();
    setLastSavedAt(null);
    setLatestRun(null);
    setLoading(true);
    getProject(projectId, getToken)
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setNameInput(p.name);
          if (p.head_version_id) setLastSavedAt(p.updated_at);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/projects");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, router, getToken, clearIR]);

  // When project has head_version_id, fetch version and set IR
  useEffect(() => {
    if (!project?.head_version_id || loading) return;
    const versionId = project.head_version_id;
    let cancelled = false;
    getVersion(versionId, getToken)
      .then((version) => {
        if (cancelled || projectId !== project.id) return;
        try {
          const validated = validateIR(version.ir_snapshot);
          setIR(validated);
        } catch {
          // Leave IR null on validation failure
        }
      })
      .catch(() => {
        // Leave IR null on fetch failure
      });
    return () => {
      cancelled = true;
    };
  }, [project?.id, project?.head_version_id, loading, projectId, getToken, setIR]);

  // Clear export error when IR changes so user can retry after fixing
  useEffect(() => {
    setExportError(null);
  }, [ir]);

  async function handleSaveName() {
    if (!project || nameInput.trim() === project.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateProject(
        project.id,
        { name: nameInput.trim() || project.name },
        getToken
      );
      setProject(updated);
      setNameInput(updated.name);
      setEditingName(false);
    } catch {
      // Keep editing state; user can retry
    } finally {
      setSavingName(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    if (!confirm("Are you sure? This will remove the project from your list.")) return;
    setDeleting(true);
    try {
      await deleteProject(project.id, getToken);
      router.replace("/projects");
    } catch {
      setDeleting(false);
    }
  }

  async function handleExport() {
    if (!project || !ir) return;
    setExportError(null);
    setExporting(true);
    try {
      const fileTree = compileIRToReactNativeSync(ir);
      const filename = buildExportFilename(project.name, project.platform);
      await downloadZipFromFileTree(fileTree, filename);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Try again."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            ← Projects
          </Link>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setNameInput(project.name);
                    setEditingName(false);
                  }
                }}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                autoFocus
                disabled={savingName}
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName}
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold">
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="hover:underline"
                title="Edit project name"
              >
                {project.name}
              </button>
            </h1>
          )}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {project.platform}
          </span>
          {lastSavedAt && (
            <span
              className="text-xs text-zinc-500 dark:text-zinc-400"
              title="Last saved"
            >
              Saved at {formatSavedAt(lastSavedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!ir || exporting}
            title={!ir ? "Generate an app first" : undefined}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {exporting ? "Preparing…" : "Export"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {deleting ? "Deleting…" : "Delete project"}
          </button>
        </div>
      </div>
      {exportError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {exportError}
        </p>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        To run exported app: unzip, then run{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          npm install && npx expo start
        </code>
        .{" "}
        <a
          href="https://docs.expo.dev/get-started/expo-cli/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Expo docs
        </a>
      </p>

      {/* Editor: prompt (left/top) + Preview/Code tabs (right/bottom) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Describe your app
          </h2>
          <PromptPanel
            projectId={projectId}
            onSuccess={handleGenerationSuccess}
            onRunUpdate={setLatestRun}
          />
          <WorkflowPanel run={latestRun} />
        </section>

        <section className="flex min-h-0 flex-col gap-2">
          <div
            role="tablist"
            className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "preview"}
              onClick={() => setActiveTab("preview")}
              className={`rounded-t px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "code"}
              onClick={() => setActiveTab("code")}
              className={`rounded-t px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "code"
                  ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Code
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              className={`rounded-t px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              History
            </button>
          </div>
          <div className="min-h-[320px] flex-1 rounded-b rounded-br-lg border border-zinc-200 dark:border-zinc-700">
            {activeTab === "preview" && (
              <Preview
                ir={ir}
                className="rounded-b-lg border-0 border-zinc-200 dark:border-zinc-700"
              />
            )}
            {activeTab === "code" && (
              <CodeView ir={ir} className="rounded-b-lg border-0" />
            )}
            {activeTab === "history" && (
              <div className="flex flex-col gap-3 p-4">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Versions
                </h3>
                <VersionList
                  projectId={projectId}
                  onRestored={setLastSavedAt}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
