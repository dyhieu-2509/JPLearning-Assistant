import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, setAuthRefreshHandler } from "../../shared/api";
import type { AuthResponse, UserResponse } from "../../shared/models";
import { syncOnboardingDraft } from "../../shared/onboardingDraft";

type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserResponse;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  completeOAuth: (accessToken: string, refreshToken: string, expiresIn?: number) => Promise<void>;
  linkGoogleAccount: (linkToken: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "vaja.auth";
const DEFAULT_EXPIRES_IN_SECONDS = 480;
const REFRESH_SKEW_MS = 60_000;
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt ?? expiryFromJwt(parsed.accessToken) ?? Date.now() + DEFAULT_EXPIRES_IN_SECONDS * 1000,
      user: parsed.user
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistAuth(auth: StoredAuth | null) {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function toStoredAuth(response: AuthResponse): StoredAuth {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + response.expiresIn * 1000,
    user: response.user
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const applyAuth = useCallback(async (response: AuthResponse) => {
    const next = toStoredAuth(response);
    await syncOnboardingDraft(response.accessToken);
    persistAuth(next);
    setAuth(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      await applyAuth(response);
    },
    [applyAuth]
  );

  const completeOAuth = useCallback(async (accessToken: string, refreshToken: string, expiresIn = DEFAULT_EXPIRES_IN_SECONDS) => {
    const claims = decodeJwt(accessToken);
    const next = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user: {
        id: String(claims.sub ?? "google-user"),
        email: String(claims.email ?? "google-user"),
        displayName: String(claims.email ?? "Google learner"),
        avatarUrl: null,
        role: String(claims.role ?? "STUDENT"),
        status: "ACTIVE"
      }
    };
    await syncOnboardingDraft(accessToken);
    persistAuth(next);
    setAuth(next);
  }, []);

  const linkGoogleAccount = useCallback(
    async (linkToken: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/google/link", {
        method: "POST",
        body: { linkToken, password }
      });
      await applyAuth(response);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { displayName, email, password }
      });
      await applyAuth(response);
    },
    [applyAuth]
  );

  const refreshAuth = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      const current = readStoredAuth();
      if (!current?.refreshToken) {
        persistAuth(null);
        setAuth(null);
        return null;
      }

      try {
        const response = await apiRequest<AuthResponse>("/auth/refresh", {
          method: "POST",
          body: { refreshToken: current.refreshToken }
        });
        const next = toStoredAuth(response);
        persistAuth(next);
        setAuth(next);
        return next.accessToken;
      } catch {
        persistAuth(null);
        setAuth(null);
        return null;
      }
    })().finally(() => {
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = auth?.refreshToken;
    const token = auth?.accessToken;
    persistAuth(null);
    setAuth(null);

    if (refreshToken) {
      try {
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          token,
          body: { refreshToken }
        });
      } catch {
        // Local logout should still complete when the backend session is already gone.
      }
    }
  }, [auth]);

  useEffect(() => {
    setAuthRefreshHandler(refreshAuth);
    return () => setAuthRefreshHandler(null);
  }, [refreshAuth]);

  useEffect(() => {
    if (!auth?.refreshToken) {
      return;
    }

    const delay = Math.max(auth.expiresAt - Date.now() - REFRESH_SKEW_MS, 5_000);
    const timer = window.setTimeout(() => {
      void refreshAuth();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [auth?.expiresAt, auth?.refreshToken, refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: auth?.accessToken ?? null,
      refreshToken: auth?.refreshToken ?? null,
      user: auth?.user ?? null,
      isAuthenticated: Boolean(auth?.accessToken),
      login,
      register,
      completeOAuth,
      linkGoogleAccount,
      logout
    }),
    [auth, completeOAuth, linkGoogleAccount, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function expiryFromJwt(token: string): number | null {
  const exp = decodeJwt(token).exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
