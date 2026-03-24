"use client";

import type { ReactNode } from "react";

type BuilderLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

/**
 * Three-column builder shell: independent scroll regions, full remaining height below top bar.
 */
export function BuilderLayout({ left, center, right }: BuilderLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 gap-0">
      <aside
        className="flex w-[min(100%,320px)] shrink-0 flex-col border-r md:w-80"
        style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{left}</div>
      </aside>
      <section className="flex min-w-0 min-h-0 flex-1 flex-col">{center}</section>
      <aside
        className="flex w-[min(100%,300px)] shrink-0 flex-col border-l lg:w-80"
        style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-surface)" }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{right}</div>
      </aside>
    </div>
  );
}
