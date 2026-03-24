/**
 * Projects API client (M14).
 * Calls FastAPI project CRUD endpoints with Clerk token.
 */

import { getApiBaseUrl } from "./api";

export class ProjectApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ProjectApiError";
  }
}

export type GetToken = () => Promise<string | null>;

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  head_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string | null;
  description?: string | null;
}

async function getAuthHeaders(getToken: GetToken): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) {
    throw new ProjectApiError("Not signed in", 401);
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response, parse: () => Promise<T>): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as {
        detail?: string | string[];
        message?: string;
      };
      const detail = data.detail ?? data.message;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) message = detail.map(String).join("; ");
    } catch {
      // ignore parse error
    }
    throw new ProjectApiError(message, res.status);
  }
  return parse();
}

export async function listProjects(getToken: GetToken): Promise<ProjectResponse[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
  });
  return handleResponse(res, () => res.json());
}

export async function getProject(
  id: string,
  getToken: GetToken
): Promise<ProjectResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${id}`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
  });
  return handleResponse(res, () => res.json());
}

export async function createProject(
  body: ProjectCreate,
  getToken: GetToken
): Promise<ProjectResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects`, {
    method: "POST",
    headers: await getAuthHeaders(getToken),
    body: JSON.stringify(body),
  });
  return handleResponse(res, () => res.json());
}

export async function updateProject(
  id: string,
  body: ProjectUpdate,
  getToken: GetToken
): Promise<ProjectResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${id}`, {
    method: "PATCH",
    headers: await getAuthHeaders(getToken),
    body: JSON.stringify(body),
  });
  return handleResponse(res, () => res.json());
}

export async function deleteProject(
  id: string,
  getToken: GetToken
): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(getToken),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { detail?: string | string[] };
      const detail = data.detail;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) message = detail.map(String).join("; ");
    } catch {
      // ignore
    }
    throw new ProjectApiError(message, res.status);
  }
}
