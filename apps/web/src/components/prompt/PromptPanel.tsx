"use client";

/**
 * Prompt UI for app generation (M13).
 * Textarea + submit, client-side validation, loading and error states.
 * On success calls onSuccess(result) so parent (M15/M16) can store IR and last-saved info.
 */

import { useCallback, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PROMPT_MAX_LENGTH, validatePrompt } from "@pixlow/ir";
import {
  createGenerationRun,
  waitForCompletedGenerationRun,
  type GenerateResult,
  type GenerationRun,
  GenerationError,
} from "@/lib/generation";

const PLACEHOLDER =
  "Describe the app you want, e.g. A to-do app with a list and add button";

export type PromptPanelProps = {
  projectId: string;
  onSuccess: (result: GenerateResult) => void;
  onRunUpdate?: (run: GenerationRun) => void;
  onError?: (message: string) => void;
  /** Fires with validated trimmed prompt right before the generation API runs. */
  onBeforeGenerate?: (trimmedPrompt: string) => void;
  /** Builder workspace uses dark themed controls. */
  variant?: "default" | "builder";
};

export function PromptPanel({
  projectId,
  onSuccess,
  onRunUpdate,
  onError,
  onBeforeGenerate,
  variant = "default",
}: PromptPanelProps) {
  const { getToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    const validation = validatePrompt(trimmed);
    if (!validation.ok) {
      setError(validation.error);
      textareaRef.current?.focus();
      return;
    }

    setError(null);
    onBeforeGenerate?.(trimmed);
    setIsLoading(true);

    try {
      const run = await createGenerationRun(projectId, trimmed, getToken);
      onRunUpdate?.(run);
      const result = await waitForCompletedGenerationRun(
        run.id,
        getToken,
        onRunUpdate
      );
      onSuccess(result);
    } catch (e) {
      const message =
        e instanceof GenerationError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Generation failed";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, prompt, getToken, onSuccess, onRunUpdate, onError, onBeforeGenerate]);

  const charCount = prompt.length;
  const atLimit = charCount >= PROMPT_MAX_LENGTH;

  const isBuilder = variant === "builder";
  const textareaClass = isBuilder
    ? "min-h-[100px] w-full resize-y rounded-lg border border-[var(--builder-border)] bg-[var(--builder-bg)] px-3 py-2 text-sm text-[var(--builder-text)] placeholder:text-[var(--builder-text-muted)] focus:border-[var(--builder-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--builder-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    : "min-h-[120px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="prompt-input" className="sr-only">
        App description
      </label>
      <textarea
        ref={textareaRef}
        id="prompt-input"
        aria-label="App description"
        placeholder={isBuilder ? "Describe changes…" : PLACEHOLDER}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isLoading}
        maxLength={PROMPT_MAX_LENGTH}
        className={textareaClass}
        rows={isBuilder ? 3 : 4}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`text-xs ${atLimit ? "text-amber-500" : ""}`}
          style={isBuilder ? { color: "var(--builder-text-muted)" } : undefined}
          aria-live="polite"
        >
          {charCount} / {PROMPT_MAX_LENGTH}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isBuilder && (
            <>
              <span
                className="text-[11px]"
                style={{ color: "var(--builder-text-muted)" }}
                title="Coming soon"
              >
                Attach
              </span>
            </>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={
              isBuilder
                ? "rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                : "rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            }
            style={isBuilder ? { backgroundColor: "var(--builder-accent)" } : undefined}
          >
            {isLoading ? "Working…" : isBuilder ? "Send" : "Generate"}
          </button>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className={
            isBuilder
              ? "rounded-lg border px-3 py-2 text-sm"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          }
          style={
            isBuilder
              ? {
                  borderColor: "var(--preview-error-border)",
                  backgroundColor: "var(--preview-error-bg)",
                  color: "var(--preview-error-text)",
                }
              : undefined
          }
        >
          {error}
        </div>
      )}
    </div>
  );
}
