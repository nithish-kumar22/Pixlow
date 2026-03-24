/**
 * Export ZIP (M17). Build ZIP from FileTree and trigger download.
 * Filename: {projectName}-{platform}-{date}.zip
 */

import JSZip from "jszip";
import type { FileTree } from "@pixlow/compiler-rn/sync";

const MAX_NAME_LENGTH = 50;
const FALLBACK_NAME = "app";

/**
 * Sanitize project name for use in ZIP filename.
 * Strips invalid filesystem chars, collapses spaces, truncates.
 */
export function sanitizeProjectNameForZip(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return FALLBACK_NAME;
  const sanitized = trimmed
    .replace(/[/\\:*?"<>|\x00-\x1f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!sanitized) return FALLBACK_NAME;
  return sanitized.length > MAX_NAME_LENGTH
    ? sanitized.slice(0, MAX_NAME_LENGTH)
    : sanitized;
}

/**
 * Build export filename: {projectName}-{platform}-{date}.zip
 */
export function buildExportFilename(
  projectName: string,
  platform: string
): string {
  const safe = sanitizeProjectNameForZip(projectName);
  const date = new Date().toISOString().slice(0, 10);
  return `${safe}-${platform}-${date}.zip`;
}

/**
 * Build ZIP from FileTree and trigger browser download.
 * Rejects if fileTree is empty.
 */
export async function downloadZipFromFileTree(
  fileTree: FileTree,
  filename: string
): Promise<void> {
  const entries = Object.entries(fileTree);
  if (entries.length === 0) {
    throw new Error("No files to export");
  }
  const zip = new JSZip();
  for (const [path, content] of entries) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
