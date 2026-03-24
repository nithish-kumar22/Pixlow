"use client";

/**
 * Version list and restore (M16).
 * Lists project versions; Restore loads a version into the IR store and creates a new head version.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { validateIR } from "@pixlow/ir";
import {
  listVersions,
  getVersion,
  createVersion,
  type VersionListItem,
  type GetToken,
} from "@/lib/versions";
import { useIRStore } from "@/stores/irStore";

function formatVersionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export type VersionListProps = {
  projectId: string;
  onRestored?: (savedAt: string) => void;
  /** Dark panels + accent restore (project editor History drawer). */
  variant?: "default" | "builder";
};

export function VersionList({ projectId, onRestored, variant = "default" }: VersionListProps) {
  const { getToken } = useAuth();
  const { ir, setIR } = useIRStore();
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const isBuilder = variant === "builder";

  const loadVersions = useCallback(
    async (tokenGetter: GetToken) => {
      setLoading(true);
      setError(null);
      try {
        const list = await listVersions(projectId, tokenGetter);
        setVersions(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load versions");
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadVersions(getToken);
  }, [projectId, getToken, loadVersions]);

  const handleRestore = useCallback(
    async (versionId: string) => {
      if (ir !== null) {
        const ok = window.confirm(
          "Discard current changes? This will replace the current app with the selected version."
        );
        if (!ok) return;
      }

      const tokenGetter = getToken;
      setRestoringId(versionId);
      try {
        const version = await getVersion(versionId, tokenGetter);
        const validated = validateIR(version.ir_snapshot);
        setIR(validated);
        const created = await createVersion(
          projectId,
          validated,
          "Restored from version",
          tokenGetter
        );
        onRestored?.(created.created_at);
        await loadVersions(tokenGetter);
      } catch {
        // Leave list as-is; user can retry
      } finally {
        setRestoringId(null);
      }
    },
    [projectId, ir, setIR, getToken, onRestored, loadVersions]
  );

  if (loading) {
    return (
      <p
        className={`text-sm ${isBuilder ? "text-[var(--builder-text-muted)]" : "text-zinc-500 dark:text-zinc-400"}`}
      >
        Loading versions…
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className={`text-sm ${isBuilder ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>{error}</p>
        <button
          type="button"
          onClick={() => loadVersions(getToken)}
          className={`text-sm underline hover:no-underline ${
            isBuilder ? "text-[var(--builder-accent)]" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <p
        className={`text-sm ${isBuilder ? "text-[var(--builder-text-muted)]" : "text-zinc-500 dark:text-zinc-400"}`}
      >
        No versions yet. Generate an app to create the first version.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {versions.map((v) => (
        <li
          key={v.id}
          className={
            isBuilder
              ? "version-list-row flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              : "flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          }
          style={
            isBuilder
              ? {
                  borderColor: "var(--builder-border)",
                }
              : undefined
          }
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium ${isBuilder ? "text-[var(--builder-text)]" : "text-zinc-900 dark:text-zinc-100"}`}
            >
              {v.message ?? "No message"}
            </p>
            <p
              className={`text-xs ${isBuilder ? "text-[var(--builder-text-muted)]" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              {formatVersionDate(v.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleRestore(v.id)}
            disabled={restoringId !== null}
            className={
              isBuilder
                ? "version-list-restore rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
                : "rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }
          >
            {restoringId === v.id ? "Restoring…" : "Restore"}
          </button>
        </li>
      ))}
    </ul>
  );
}
