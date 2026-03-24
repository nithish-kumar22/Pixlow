"use client";

/**
 * Read-only code view (M15). Shows compiled FileTree from current IR in a tabbed list.
 * One-way: IR → compile → display; no edits sync back to IR.
 */

import { useMemo, useState } from "react";
import type { AppIR } from "@pixlow/ir";
import { compileIRToReactNativeSync } from "@pixlow/compiler-rn/sync";

const PLACEHOLDER = "Describe your app and click Generate to see the code.";

const MAIN_FILES_ORDER = ["App.tsx", "theme.ts", "package.json"];

function orderedFileEntries(fileTree: Record<string, string>): [string, string][] {
  const main: [string, string][] = [];
  const screens: [string, string][] = [];
  for (const path of Object.keys(fileTree)) {
    if (MAIN_FILES_ORDER.includes(path)) {
      main.push([path, fileTree[path]]);
    } else {
      screens.push([path, fileTree[path]]);
    }
  }
  main.sort(([a], [b]) => MAIN_FILES_ORDER.indexOf(a) - MAIN_FILES_ORDER.indexOf(b));
  screens.sort(([a], [b]) => a.localeCompare(b));
  return [...main, ...screens];
}

export type CodeViewProps = {
  ir: AppIR | null;
  className?: string;
  variant?: "default" | "builder";
};

export function CodeView({ ir, className, variant = "default" }: CodeViewProps) {
  const [activePath, setActivePath] = useState<string | null>(null);

  const { entries, error } = useMemo(() => {
    if (!ir) return { entries: [] as [string, string][], error: null };
    try {
      const fileTree = compileIRToReactNativeSync(ir);
      const entries = orderedFileEntries(fileTree);
      return { entries, error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { entries: [], error: message };
    }
  }, [ir]);

  // Derive selected path: use activePath if still in entries, else first file (avoids setState in effect)
  const selectedPath = useMemo(() => {
    if (entries.length === 0) return null;
    const paths = entries.map(([p]) => p);
    return paths.includes(activePath ?? "") ? activePath : entries[0][0];
  }, [entries, activePath]);

  const currentContent = useMemo(() => {
    if (!selectedPath || entries.length === 0) return null;
    const found = entries.find(([path]) => path === selectedPath);
    return found ? found[1] : null;
  }, [selectedPath, entries]);

  const isBuilder = variant === "builder";

  if (!ir) {
    return (
      <div
        className={className}
        style={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: isBuilder ? "var(--builder-bg)" : "var(--preview-empty-bg, #f1f5f9)",
          color: isBuilder ? "var(--builder-text-muted)" : "var(--preview-empty-text, #64748b)",
          borderRadius: 8,
        }}
      >
        {PLACEHOLDER}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: isBuilder ? "var(--preview-error-bg)" : "var(--preview-error-bg, #fef2f2)",
          color: isBuilder ? "var(--preview-error-text)" : "var(--preview-error-text, #b91c1c)",
          borderRadius: 8,
        }}
        role="alert"
      >
        <div>
          <strong>Code unavailable</strong>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className={className}
        style={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: isBuilder ? "var(--builder-bg)" : "var(--preview-empty-bg, #f1f5f9)",
          color: isBuilder ? "var(--builder-text-muted)" : "var(--preview-empty-text, #64748b)",
          borderRadius: 8,
        }}
      >
        {PLACEHOLDER}
      </div>
    );
  }

  const displayPath = selectedPath ?? entries[0]?.[0];
  const content = currentContent ?? entries.find(([p]) => p === displayPath)?.[1] ?? "";

  if (isBuilder) {
    return (
      <div
        className={className}
        style={{
          minHeight: 320,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--builder-surface)",
        }}
      >
        <div
          role="tablist"
          className="flex flex-wrap gap-1 border-b px-2 pt-2"
          style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-bg)" }}
        >
          {entries.map(([path]) => (
            <button
              key={path}
              type="button"
              role="tab"
              aria-selected={path === displayPath}
              onClick={() => setActivePath(path)}
              className="rounded-t px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: path === displayPath ? "var(--builder-surface-elevated)" : "transparent",
                color: path === displayPath ? "var(--builder-text)" : "var(--builder-text-muted)",
              }}
            >
              {path}
            </button>
          ))}
        </div>
        <pre
          className="min-h-0 flex-1 overflow-auto border border-t-0 p-4 text-sm"
          style={{
            margin: 0,
            borderColor: "var(--builder-border)",
            backgroundColor: "var(--builder-bg)",
          }}
        >
          <code className="font-mono" style={{ color: "var(--builder-text)" }}>
            {content}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight: 320, display: "flex", flexDirection: "column" }}>
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 px-2 pt-2 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
        {entries.map(([path]) => (
          <button
            key={path}
            type="button"
            role="tab"
            aria-selected={path === displayPath}
            onClick={() => setActivePath(path)}
            className={`rounded-t px-3 py-2 text-sm font-medium transition-colors ${
              path === displayPath
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {path}
          </button>
        ))}
      </div>
      <pre
        className="flex-1 overflow-auto border border-t-0 border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        style={{ margin: 0 }}
      >
        <code className="font-mono text-zinc-800 dark:text-zinc-200">{content}</code>
      </pre>
    </div>
  );
}
