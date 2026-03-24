/**
 * Versions API client (M15/M16).
 * Fetches project version by ID; list versions; create version (save/restore).
 */

import type { AppIR } from "@pixlow/ir";
import { getApiBaseUrl } from "./api";

export type GetToken = () => Promise<string | null>;

export interface VersionListItem {
  id: string;
  project_id: string;
  message: string | null;
  created_at: string;
}

export interface VersionResponse {
  id: string;
  project_id: string;
  ir_snapshot: unknown;
  ir_hash: string | null;
  message: string | null;
  created_at: string;
}

export class VersionApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "VersionApiError";
  }
}

async function getAuthHeaders(getToken: GetToken): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) {
    throw new VersionApiError("Not signed in", 401);
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
    throw new VersionApiError(message, res.status);
  }
  return parse();
}

/**
 * List versions for a project (newest first).
 */
export async function listVersions(
  projectId: string,
  getToken: GetToken
): Promise<VersionListItem[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${projectId}/versions`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
  });
  return handleResponse(res, () => res.json());
}

/**
 * Create a new version (save IR). Sets it as project head.
 */
export async function createVersion(
  projectId: string,
  ir: AppIR,
  message: string | null | undefined,
  getToken: GetToken
): Promise<VersionResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${projectId}/versions`, {
    method: "POST",
    headers: await getAuthHeaders(getToken),
    body: JSON.stringify({ ir, message: message ?? null }),
  });
  return handleResponse(res, () => res.json());
}

/**
 * Fetch a single version by ID. Returns ir_snapshot for loading into editor.
 */
export async function getVersion(
  versionId: string,
  getToken: GetToken
): Promise<VersionResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/versions/${versionId}`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
  });
  return handleResponse(res, () => res.json());
}
