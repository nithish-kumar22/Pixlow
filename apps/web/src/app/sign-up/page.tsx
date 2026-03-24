"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page-gradient flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div
        className="app-card w-full max-w-sm p-8 ring-1 ring-violet-500/20"
        style={{ boxShadow: "0 0 60px rgba(139, 92, 246, 0.1), 0 25px 50px rgba(0,0,0,0.4)" }}
      >
        <div
          className="mb-6 inline-flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.35)",
          }}
        >
          P
        </div>
        <h1 className="text-xl font-bold text-app-text">Sign up</h1>
        <p className="mt-1 text-sm text-app-muted">Create an account with your email.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="app-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="app-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="app-label">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="app-input"
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="app-btn-primary w-full justify-center !rounded-lg">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-app-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-app-accent hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
