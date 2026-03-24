"use client";

import { useCallback, useState } from "react";
import type { GenerateResult, GenerationRun } from "@/lib/generation";
import { PromptPanel } from "@/components/prompt/PromptPanel";
import { WorkflowPanel } from "@/components/prompt/WorkflowPanel";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type PromptSessionPanelProps = {
  projectId: string;
  run: GenerationRun | null;
  onGenerateSuccess: (result: GenerateResult) => void;
  onRunUpdate?: (run: GenerationRun) => void;
  onError?: (message: string) => void;
};

export function PromptSessionPanel({
  projectId,
  run,
  onGenerateSuccess,
  onRunUpdate,
  onError,
}: PromptSessionPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleBeforeGenerate = useCallback((trimmed: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: trimmed },
    ]);
  }, []);

  const handleSuccess = useCallback(
    (result: GenerateResult) => {
      const n = result.ir.screens?.length ?? 0;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text:
            n > 0
              ? `Updated the app (${n} screen${n === 1 ? "" : "s"}). You can also drag components in the canvas.`
              : "Generation finished.",
        },
      ]);
      onGenerateSuccess(result);
    },
    [onGenerateSuccess]
  );

  return (
    <div className="flex h-full min-h-[200px] flex-col">
      <div
        className="flex shrink-0 items-center justify-between border-b px-3 py-2 text-[11px]"
        style={{ borderColor: "var(--builder-border)", color: "var(--builder-text-muted)" }}
      >
        <span className="font-medium" style={{ color: "var(--builder-text)" }}>
          AI model
        </span>
        <span>Default</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--builder-text-muted)" }}>
            Describe changes to your app. Each prompt appears here as a short session log.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border-l-2 px-3 py-2.5 shadow-sm"
            style={
              m.role === "user"
                ? {
                    borderLeftColor: "#22d3ee",
                    borderTop: "1px solid var(--builder-border)",
                    borderRight: "1px solid var(--builder-border)",
                    borderBottom: "1px solid var(--builder-border)",
                    background:
                      "linear-gradient(105deg, rgba(34, 211, 238, 0.08) 0%, var(--builder-bg) 45%)",
                  }
                : {
                    borderLeftColor: "#8b5cf6",
                    borderTop: "1px solid var(--builder-border)",
                    borderRight: "1px solid var(--builder-border)",
                    borderBottom: "1px solid var(--builder-border)",
                    background:
                      "linear-gradient(105deg, rgba(139, 92, 246, 0.12) 0%, var(--builder-surface-elevated) 50%)",
                  }
            }
          >
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: m.role === "user" ? "#67e8f9" : "#c4b5fd" }}
            >
              {m.role === "user" ? "You" : "AI"}
            </div>
            <p className="text-sm leading-snug" style={{ color: "var(--builder-text)" }}>
              {m.text}
            </p>
          </div>
        ))}
        {run && (
          <div className="pt-1">
            <WorkflowPanel run={run} />
          </div>
        )}
      </div>

      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
      >
        <PromptPanel
          projectId={projectId}
          variant="builder"
          onBeforeGenerate={handleBeforeGenerate}
          onSuccess={handleSuccess}
          onRunUpdate={onRunUpdate}
          onError={onError}
        />
      </div>
    </div>
  );
}
