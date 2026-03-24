import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sampleIR } from "@pixlow/ir";
import { listVersions, createVersion, getVersion } from "./versions";

describe("versions API client", () => {
  const projectId = "550e8400-e29b-41d4-a716-446655440000";
  const getToken = vi.fn<[], Promise<string | null>>();

  const mockVersionListItem = {
    id: "660e8400-e29b-41d4-a716-446655440001",
    project_id: projectId,
    message: "Initial generation",
    created_at: "2025-03-01T12:00:00Z",
  };

  const mockVersionResponse = {
    id: "660e8400-e29b-41d4-a716-446655440001",
    project_id: projectId,
    ir_snapshot: sampleIR,
    ir_hash: "abc123",
    message: "Initial generation",
    created_at: "2025-03-01T12:00:00Z",
  };

  beforeEach(() => {
    getToken.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listVersions returns array on 200", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify([mockVersionListItem]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await listVersions(projectId, getToken);

    expect(result).toEqual([mockVersionListItem]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/projects/${projectId}/versions`);
    expect(options?.method).toBe("GET");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    });
  });

  it("listVersions throws VersionApiError when not signed in", async () => {
    getToken.mockResolvedValue(null);

    await expect(listVersions(projectId, getToken)).rejects.toMatchObject({
      name: "VersionApiError",
      message: "Not signed in",
      status: 401,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("listVersions throws VersionApiError on 404", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(listVersions(projectId, getToken)).rejects.toMatchObject({
      name: "VersionApiError",
      message: "Project not found",
      status: 404,
    });
  });

  it("createVersion sends ir and message and returns VersionResponse on 201", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockVersionResponse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await createVersion(
      projectId,
      sampleIR,
      "Initial generation",
      getToken
    );

    expect(result).toEqual(mockVersionResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/projects/${projectId}/versions`);
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(options?.body as string);
    expect(body.ir).toEqual(sampleIR);
    expect(body.message).toBe("Initial generation");
  });

  it("createVersion sends null message when message is undefined", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockVersionResponse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );

    await createVersion(projectId, sampleIR, undefined, getToken);

    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string);
    expect(body.message).toBeNull();
  });

  it("getVersion returns VersionResponse on 200", async () => {
    getToken.mockResolvedValue("token");
    const versionId = mockVersionResponse.id;
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockVersionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await getVersion(versionId, getToken);

    expect(result).toEqual(mockVersionResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(`/versions/${versionId}`);
  });
});
