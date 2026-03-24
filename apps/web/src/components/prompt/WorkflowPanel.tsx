"use client";

import type { GenerationArtifact, GenerationRun } from "@/lib/generation";

type Props = {
  run: GenerationRun | null;
};

function formatAgentRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function artifactSummary(artifact: GenerationArtifact): string | null {
  const summary = artifact.content.summary;
  return typeof summary === "string" ? summary : null;
}

export function WorkflowPanel({ run }: Props) {
  if (!run) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Multi-agent workflow output will appear here after you start a generation run.
      </div>
    );
  }

  const visibleArtifacts = run.artifacts.filter((item) => item.artifact_type !== "final_ir");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Status: {run.status}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Stage: {run.current_stage}
        </span>
        {run.active_agent_role && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Active: {formatAgentRole(run.active_agent_role)}
          </span>
        )}
      </div>

      {run.error_message && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {run.error_message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {run.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/40"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {step.step_order}. {formatAgentRole(step.agent_role)}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">{step.stage}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {step.status}
              </span>
            </div>
            {step.summary && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {step.summary}
              </p>
            )}
            {step.error_message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {step.error_message}
              </p>
            )}
          </div>
        ))}
      </div>

      {visibleArtifacts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Agent Artifacts
          </h3>
          {visibleArtifacts.map((artifact) => (
            <details
              key={artifact.id}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/40"
            >
              <summary className="cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {artifact.title} ({formatAgentRole(artifact.agent_role)})
              </summary>
              {artifactSummary(artifact) && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {artifactSummary(artifact)}
                </p>
              )}
              <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {JSON.stringify(artifact.content, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
