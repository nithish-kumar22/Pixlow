import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "./projects";

const mockProject = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "My App",
  description: "A test app",
  platform: "react-native",
  head_version_id: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("projects API client", () => {
  const getToken = vi.fn<[], Promise<string | null>>();

  beforeEach(() => {
    getToken.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listProjects returns array on 200", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify([mockProject]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await listProjects(getToken);

    expect(result).toEqual([mockProject]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/projects$/);
    expect(options?.method).toBe("GET");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    });
  });

  it("getProject returns project on 200", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockProject), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await getProject(mockProject.id, getToken);

    expect(result).toEqual(mockProject);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(mockProject.id);
  });

  it("createProject sends body and returns project on 201", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockProject), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await createProject(
      { name: "My App", description: "A test" },
      getToken
    );

    expect(result).toEqual(mockProject);
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.method).toBe("POST");
    expect(JSON.parse(options?.body as string)).toEqual({
      name: "My App",
      description: "A test",
    });
  });

  it("updateProject sends body and returns project on 200", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ...mockProject, name: "Updated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await updateProject(
      mockProject.id,
      { name: "Updated" },
      getToken
    );

    expect(result.name).toBe("Updated");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(mockProject.id);
    expect(options?.method).toBe("PATCH");
    expect(JSON.parse(options?.body as string)).toEqual({ name: "Updated" });
  });

  it("deleteProject resolves on 204", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    await deleteProject(mockProject.id, getToken);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(mockProject.id);
    expect(options?.method).toBe("DELETE");
  });

  it("throws ProjectApiError when getToken returns null", async () => {
    getToken.mockResolvedValue(null);

    await expect(listProjects(getToken)).rejects.toMatchObject({
      name: "ProjectApiError",
      message: "Not signed in",
      status: 401,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("throws ProjectApiError with detail on 404", async () => {
    getToken.mockResolvedValue("token");
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(getProject(mockProject.id, getToken)).rejects.toMatchObject({
      name: "ProjectApiError",
      message: "Project not found",
      status: 404,
    });
  });
});
