/**
 * Generation API client (M13).
 * Calls FastAPI POST /projects/:id/generate with Clerk token; returns validated IR and save info (M16).
 */

import type { AppIR } from "@pixlow/ir";
import { validateIR } from "@pixlow/ir";
import { getApiBaseUrl } from "./api";

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export type GetToken = () => Promise<string | null>;

export interface RunStep {
  id: string;
  stage: string;
  agent_role: string;
  step_order: number;
  status: string;
  summary: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface GenerationArtifact {
  id: string;
  step_id: string | null;
  agent_role: string;
  artifact_type: string;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface GenerationRun {
  id: string;
  project_id: string;
  owner_id: string;
  source_version_id: string | null;
  result_version_id: string | null;
  prompt: string;
  status: string;
  current_stage: string;
  active_agent_role: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  steps: RunStep[];
  artifacts: GenerationArtifact[];
}

/** Result of generateApp: IR plus optional version id and saved-at time from backend. */
export interface GenerateResult {
  ir: AppIR;
  versionId?: string;
  savedAt?: string;
  run?: GenerationRun;
}

function getFinalIrFromRun(run: GenerationRun): unknown {
  return run.artifacts.find((item) => item.artifact_type === "final_ir")?.content;
}

/**
 * Generate app IR from prompt via backend. Uses Clerk token for auth.
 * Validates response IR with validateIR. Returns IR and optional version_id/created_at for "Saved" indicator.
 */
export async function generateApp(
  projectId: string,
  prompt: string,
  getToken: GetToken
): Promise<GenerateResult> {
  const token = await getToken();
  if (!token) {
    throw new GenerationError("Not signed in");
  }

  const base = getApiBaseUrl();
  const url = `${base}/projects/${projectId}/generate`;
  const body = JSON.stringify({ prompt: prompt.trim() });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

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
    throw new GenerationError(message, res.status);
  }

  let data: {
    ir?: unknown;
    version_id?: string;
    created_at?: string;
    run_id?: string;
    status?: string;
    stage?: string;
    steps?: RunStep[];
  };
  try {
    data = await res.json();
  } catch {
    throw new GenerationError("Invalid response from server");
  }

  if (data.ir == null) {
    throw new GenerationError("Invalid response: missing ir");
  }

  try {
    const ir = validateIR(data.ir) as AppIR;
    return {
      ir,
      versionId: data.version_id,
      savedAt: data.created_at ?? undefined,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    throw new GenerationError(
      detail ? `Invalid response: IR validation failed — ${detail}` : "Invalid response: IR validation failed"
    );
  }
}

async function getAuthHeaders(getToken: GetToken): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) {
    throw new GenerationError("Not signed in", 401);
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { detail?: string | string[]; message?: string };
      const detail = data.detail ?? data.message;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) message = detail.map(String).join("; ");
    } catch {
      // ignore parse error
    }
    throw new GenerationError(message, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new GenerationError("Invalid response from server");
  }
}

export async function createGenerationRun(
  projectId: string,
  prompt: string,
  getToken: GetToken
): Promise<GenerationRun> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/projects/${projectId}/generation-runs`, {
    method: "POST",
    headers: await getAuthHeaders(getToken),
    body: JSON.stringify({ prompt: prompt.trim() }),
  });
  const data = await parseJsonOrThrow<{ run: GenerationRun }>(res);
  return data.run;
}

export async function getGenerationRun(
  runId: string,
  getToken: GetToken
): Promise<GenerationRun> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/generation-runs/${runId}`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
  });
  return parseJsonOrThrow<GenerationRun>(res);
}

export async function waitForCompletedGenerationRun(
  runId: string,
  getToken: GetToken,
  onUpdate?: (run: GenerationRun) => void,
  intervalMs = 1200
): Promise<GenerateResult> {
  for (;;) {
    const run = await getGenerationRun(runId, getToken);
    onUpdate?.(run);

    if (run.status === "completed") {
      const rawIr = getFinalIrFromRun(run);
      if (!rawIr) {
        throw new GenerationError("Generation completed without a final IR");
      }
      const ir = validateIR(rawIr) as AppIR;
      return {
        ir,
        versionId: run.result_version_id ?? undefined,
        savedAt: run.completed_at ?? undefined,
        run,
      };
    }

    if (run.status === "failed" || run.status === "needs_input") {
      throw new GenerationError(run.error_message ?? "Generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
