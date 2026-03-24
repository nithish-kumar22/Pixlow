"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  listProjects,
  deleteProject,
  type ProjectResponse,
  ProjectApiError,
} from "@/lib/projects";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ProjectsList() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadProjects() {
    setLoading(true);
    setError(null);
    listProjects(getToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ProjectApiError ? err.message : "Failed to load projects"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  async function handleDelete(project: ProjectResponse, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id, getToken);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      setError(err instanceof ProjectApiError ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-10 text-sm text-app-muted">Loading projects…</div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={loadProjects}
          className="mt-2 text-sm font-medium text-app-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mt-10 rounded-xl border-2 border-dashed border-app-accent/35 bg-gradient-to-b from-blue-500/5 to-transparent px-8 py-12 text-center">
        <p className="text-app-muted">Create your first app to get started.</p>
        <Link href="/projects/new" className="app-btn-primary mt-6 inline-flex">
          Create your first app
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="app-card app-card-hover relative block overflow-hidden p-5"
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 opacity-80"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-app-text">{project.name}</h2>
                <span className="mt-2 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                  {project.platform}
                </span>
                <p className="mt-2 text-xs text-app-muted">Updated {formatDate(project.updated_at)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(project, e)}
                disabled={deletingId === project.id}
                className="shrink-0 rounded-lg p-2 text-app-muted transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
                title="Delete project"
                aria-label={`Delete ${project.name}`}
              >
                {deletingId === project.id ? (
                  <span className="text-xs">…</span>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
