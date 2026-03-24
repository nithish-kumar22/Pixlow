"use client";

import { useEffect } from "react";
import { useBuilderStore } from "@/stores/builderStore";

/**
 * Full-viewport builder theme wrapper for /projects/[id].
 */
export function BuilderWorkspaceShell({ children }: { children: React.ReactNode }) {
  const reset = useBuilderStore((s) => s.reset);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <div className="builder-workspace flex min-h-0 flex-1 flex-col md:min-h-[100dvh]">{children}</div>
  );
}
