"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useBuilderStore } from "@/stores/builderStore";

function initials(user: { name: string | null; email: string }): string {
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase() || a.toUpperCase() || "?";
  }
  return user.email.slice(0, 2).toUpperCase();
}

export type BuilderTopBarProps = {
  projectName: string;
  lastSavedAt: string | null;
  saving: boolean;
  onPublish: () => void;
  publishDisabled?: boolean;
};

export function BuilderTopBar({
  projectName,
  lastSavedAt,
  saving,
  onPublish,
  publishDisabled,
}: BuilderTopBarProps) {
  const { user } = useAuth();
  const historyOpen = useBuilderStore((s) => s.historyPanelOpen);
  const setHistoryPanelOpen = useBuilderStore((s) => s.setHistoryPanelOpen);

  return (
    <header
      className="relative flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4"
      style={{
        borderColor: "var(--builder-border)",
        backgroundColor: "var(--builder-surface)",
        boxShadow: "0 1px 0 rgba(59, 130, 246, 0.08), 0 12px 40px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
        aria-hidden
      />
      <div className="relative flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="shrink-0 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-sm font-semibold tracking-tight text-transparent"
        >
          Prompt to App
        </Link>
        <span style={{ color: "var(--builder-text-muted)" }} aria-hidden>
          /
        </span>
        <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
          <Link
            href="/projects"
            className="shrink-0 transition-opacity hover:opacity-80"
            style={{ color: "var(--builder-accent)" }}
          >
            Projects
          </Link>
          <span style={{ color: "var(--builder-text-muted)" }} aria-hidden>
            ›
          </span>
          <span className="truncate font-medium" style={{ color: "var(--builder-text)" }}>
            {projectName}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHistoryPanelOpen(!historyOpen)}
          className="rounded-md px-3 py-2 text-xs font-medium transition-colors"
          style={{
            color: "var(--builder-text-muted)",
            backgroundColor: historyOpen ? "var(--builder-surface-elevated)" : "transparent",
          }}
        >
          History
        </button>
        <button
          type="button"
          className="rounded-md px-3 py-2 text-xs font-medium transition-opacity hover:opacity-90"
          style={{ color: "var(--builder-text-muted)" }}
          title="Coming soon"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishDisabled || saving}
          className="rounded-md px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)",
            boxShadow: "0 2px 16px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {saving ? "Publishing…" : "Publish"}
        </button>
        {lastSavedAt && (
          <span className="hidden text-[11px] sm:inline" style={{ color: "var(--builder-text-muted)" }}>
            Saved {new Date(lastSavedAt).toLocaleString()}
          </span>
        )}
        {user && (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-blue-500/30"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
            }}
            title={user.email}
          >
            {initials(user)}
          </div>
        )}
      </div>
    </header>
  );
}
