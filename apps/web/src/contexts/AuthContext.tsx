"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiBaseUrl } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_token";
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE_DAYS = 7;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setAuthCookie(token: string) {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const base = getApiBaseUrl();

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem(AUTH_TOKEN_KEY, t);
      setAuthCookie(t);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      clearAuthCookie();
    }
  }, []);

  const fetchUser = useCallback(
    async (t: string): Promise<AuthUser | null> => {
      const res = await fetch(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { id: string; email: string; name: string | null };
      return { id: data.id, email: data.email, name: data.name };
    },
    [base]
  );

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    const cookieToken = getTokenFromCookie();
    const t = stored || cookieToken;
    if (!t) {
      // This is a client-side initialization path; we intentionally update state immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    setTokenState(t);
    if (!stored && cookieToken) localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
    fetchUser(t)
      .then((u) => {
        setUser(u);
        if (!u) setToken(null);
      })
      .finally(() => setLoading(false));
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { detail?: string };
        throw new Error(err.detail ?? "Login failed");
      }
      const data = (await res.json()) as { access_token: string };
      setToken(data.access_token);
      const u = await fetchUser(data.access_token);
      setUser(u);
    },
    [base, setToken, fetchUser]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { detail?: string };
        throw new Error(err.detail ?? "Registration failed");
      }
      const data = (await res.json()) as { access_token: string };
      setToken(data.access_token);
      const u = await fetchUser(data.access_token);
      setUser(u);
    },
    [base, setToken, fetchUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    setTokenState(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    clearAuthCookie();
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    const t = token ?? (typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null);
    return t;
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, getToken }),
    [user, token, loading, login, register, logout, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
