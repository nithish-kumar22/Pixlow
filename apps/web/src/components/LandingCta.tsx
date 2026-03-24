"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function LandingCta() {
  const { user } = useAuth();

  if (user) {
    return (
      <Link href="/dashboard" className="app-btn-primary app-btn-primary-lg">
        Get started
      </Link>
    );
  }

  return (
    <Link href="/sign-up" className="app-btn-primary app-btn-primary-lg">
      Get started
    </Link>
  );
}
