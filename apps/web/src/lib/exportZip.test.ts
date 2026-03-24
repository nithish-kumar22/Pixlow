import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeProjectNameForZip,
  buildExportFilename,
  downloadZipFromFileTree,
} from "./exportZip";

describe("sanitizeProjectNameForZip", () => {
  it("returns fallback for empty or whitespace-only", () => {
    expect(sanitizeProjectNameForZip("")).toBe("app");
    expect(sanitizeProjectNameForZip("   ")).toBe("app");
    expect(sanitizeProjectNameForZip("\t\n")).toBe("app");
  });

  it("strips invalid filesystem characters", () => {
    expect(sanitizeProjectNameForZip("my/app")).toBe("my app");
    expect(sanitizeProjectNameForZip("test:file")).toBe("test file");
    expect(sanitizeProjectNameForZip('a*b?c"d')).toBe("a b c d");
  });

  it("collapses multiple spaces", () => {
    expect(sanitizeProjectNameForZip("hello   world")).toBe("hello world");
  });

  it("truncates to 50 chars", () => {
    const long = "a".repeat(60);
    expect(sanitizeProjectNameForZip(long)).toHaveLength(50);
    expect(sanitizeProjectNameForZip(long)).toBe("a".repeat(50));
  });

  it("returns trimmed name when valid", () => {
    expect(sanitizeProjectNameForZip("  My Todo App  ")).toBe("My Todo App");
  });

  it("returns fallback when result is empty after sanitize", () => {
    expect(sanitizeProjectNameForZip("://???")).toBe("app");
  });
});

describe("buildExportFilename", () => {
  it("produces {name}-{platform}-{date}.zip format", () => {
    const filename = buildExportFilename("My App", "react-native");
    expect(filename).toMatch(/^My App-react-native-\d{4}-\d{2}-\d{2}\.zip$/);
  });

  it("sanitizes project name", () => {
    const filename = buildExportFilename("my/app:name", "react-native");
    expect(filename).toMatch(/^my app name-react-native-\d{4}-\d{2}-\d{2}\.zip$/);
  });
});

describe("downloadZipFromFileTree", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    const mockClick = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click: mockClick,
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when fileTree is empty", async () => {
    await expect(
      downloadZipFromFileTree({}, "test.zip")
    ).rejects.toThrow("No files to export");
  });

  it("adds files to ZIP and triggers download", async () => {
    const fileTree = { "App.tsx": "content", "package.json": "{}" };
    await downloadZipFromFileTree(fileTree, "my-app.zip");
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    const anchor = (document.createElement as ReturnType<typeof vi.fn>).mock
      .results[0].value;
    expect(anchor.download).toBe("my-app.zip");
    expect(anchor.click).toHaveBeenCalled();
  });
});
