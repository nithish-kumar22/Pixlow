"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** Project editor uses its own chrome; hide global header on /projects/[id] (not /projects/new). */
function useHideHeaderForProjectEditor(): boolean {
  const pathname = usePathname();
  if (!pathname?.startsWith("/projects/")) return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return false;
  if (parts[1] === "new") return false;
  return true;
}

function NavPill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-app-muted transition-colors hover:bg-white/5 hover:text-app-text"
    >
      {children}
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const hideForBuilder = useHideHeaderForProjectEditor();

  if (hideForBuilder) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-app-border/60 bg-app-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-lg shadow-blue-500/30"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
            }}
            aria-hidden
          >
            P
          </span>
          <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            Prompt to App
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {loading ? (
            <span className="text-sm text-app-muted">Loading…</span>
          ) : user ? (
            <>
              <NavPill href="/dashboard">Dashboard</NavPill>
              <NavPill href="/projects">Projects</NavPill>
              <span className="hidden px-2 text-sm text-app-muted sm:inline max-w-[140px] truncate">
                {user.name || user.email}
              </span>
              <Link
                href="/projects/new"
                className="app-btn-primary ml-1 text-sm !py-2 !px-4"
              >
                New project
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-app-muted transition-colors hover:bg-white/5 hover:text-app-text"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="app-btn-ghost">
                Sign in
              </Link>
              <Link href="/sign-up" className="app-btn-primary text-sm !py-2 !px-4">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
