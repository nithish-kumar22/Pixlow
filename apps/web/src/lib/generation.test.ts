import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sampleIR } from "@pixlow/ir";
import {
  createGenerationRun,
  generateApp,
  getGenerationRun,
  waitForCompletedGenerationRun,
} from "./generation";

describe("generateApp", () => {
  const projectId = "550e8400-e29b-41d4-a716-446655440000";
  const prompt = "A to-do app with a list and add button";
  const getToken = vi.fn<[], Promise<string | null>>();

  beforeEach(() => {
    getToken.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns GenerateResult with ir and optional version_id/created_at on 200", async () => {
    getToken.mockResolvedValue("mock-jwt-token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          ir: sampleIR,
          version_id: "660e8400-e29b-41d4-a716-446655440001",
          created_at: "2025-03-01T12:00:00Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const result = await generateApp(projectId, prompt, getToken);

    expect(result.ir).toEqual(sampleIR);
    expect(result.versionId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.savedAt).toBe("2025-03-01T12:00:00Z");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(projectId);
    expect(url).toContain("/generate");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer mock-jwt-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(options?.body as string)).toEqual({
      prompt: prompt.trim(),
    });
  });

  it("throws GenerationError with message when getToken returns null", async () => {
    getToken.mockResolvedValue(null);

    await expect(generateApp(projectId, prompt, getToken)).rejects.toMatchObject({
      name: "GenerationError",
      message: "Not signed in",
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("throws GenerationError with detail on 400", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockImplementation(
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ detail: "Prompt must be at least 10 characters" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        )
    );

    await expect(generateApp(projectId, "short", getToken)).rejects.toMatchObject({
      name: "GenerationError",
      message: "Prompt must be at least 10 characters",
    });
  });

  it("throws GenerationError with detail on 502", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockImplementation(
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ detail: "LLM configuration error" }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        )
    );

    await expect(generateApp(projectId, prompt, getToken)).rejects.toMatchObject({
      name: "GenerationError",
      message: "LLM configuration error",
    });
  });

  it("throws when response is 200 but ir is missing", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(generateApp(projectId, prompt, getToken)).rejects.toMatchObject({
      name: "GenerationError",
      message: "Invalid response: missing ir",
    });
  });

  it("creates an async generation run", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          run: {
            id: "770e8400-e29b-41d4-a716-446655440001",
            project_id: projectId,
            owner_id: "880e8400-e29b-41d4-a716-446655440001",
            source_version_id: null,
            result_version_id: null,
            prompt,
            status: "queued",
            current_stage: "draft",
            active_agent_role: "project_manager",
            error_message: null,
            created_at: "2026-03-18T12:00:00Z",
            updated_at: "2026-03-18T12:00:00Z",
            completed_at: null,
            steps: [],
            artifacts: [],
          },
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createGenerationRun(projectId, prompt, getToken);
    expect(result.id).toBe("770e8400-e29b-41d4-a716-446655440001");
    expect(result.status).toBe("queued");
  });

  it("waits for a run to complete and returns the final IR", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "770e8400-e29b-41d4-a716-446655440001",
          project_id: projectId,
          owner_id: "880e8400-e29b-41d4-a716-446655440001",
          source_version_id: null,
          result_version_id: "660e8400-e29b-41d4-a716-446655440001",
          prompt,
          status: "completed",
          current_stage: "completed",
          active_agent_role: "project_manager",
          error_message: null,
          created_at: "2026-03-18T12:00:00Z",
          updated_at: "2026-03-18T12:00:01Z",
          completed_at: "2026-03-18T12:00:01Z",
          steps: [],
          artifacts: [
            {
              id: "art-1",
              step_id: null,
              agent_role: "project_manager",
              artifact_type: "final_ir",
              title: "Final IR",
              content: sampleIR,
              created_at: "2026-03-18T12:00:01Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const updates: string[] = [];
    const result = await waitForCompletedGenerationRun(
      "770e8400-e29b-41d4-a716-446655440001",
      getToken,
      (run) => updates.push(run.status),
      1
    );

    expect(updates).toEqual(["completed"]);
    expect(result.ir).toEqual(sampleIR);
    expect(result.versionId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.run?.status).toBe("completed");
  });

  it("fetches a single generation run", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "770e8400-e29b-41d4-a716-446655440001",
          project_id: projectId,
          owner_id: "880e8400-e29b-41d4-a716-446655440001",
          source_version_id: null,
          result_version_id: null,
          prompt,
          status: "in_progress",
          current_stage: "planning",
          active_agent_role: "architect",
          error_message: null,
          created_at: "2026-03-18T12:00:00Z",
          updated_at: "2026-03-18T12:00:00Z",
          completed_at: null,
          steps: [],
          artifacts: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const run = await getGenerationRun("770e8400-e29b-41d4-a716-446655440001", getToken);
    expect(run.current_stage).toBe("planning");
    expect(run.active_agent_role).toBe("architect");
  });
});
