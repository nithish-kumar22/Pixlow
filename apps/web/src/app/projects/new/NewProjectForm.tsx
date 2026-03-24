"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, ProjectApiError } from "@/lib/projects";

export function NewProjectForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const project = await createProject(
        {
          name: name.trim() || "Untitled App",
          description: description.trim() || undefined,
        },
        getToken
      );
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ProjectApiError ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className="app-card p-8 ring-1 ring-cyan-500/15"
      style={{ boxShadow: "0 0 40px rgba(34, 211, 238, 0.06), 0 20px 40px rgba(0,0,0,0.35)" }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="app-label">
            Project name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled App"
            className="app-input"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="description" className="app-label">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of your app"
            className="app-input"
            disabled={loading}
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary !rounded-lg disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create project"}
          </button>
          <Link href="/projects" className="app-btn-ghost !rounded-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
