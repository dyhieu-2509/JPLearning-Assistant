import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiRequest } from "../../shared/api";
import type { AuthResponse, UserResponse } from "../../shared/models";

type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  completeOAuth: (accessToken: string, refreshToken: string) => void;
  linkGoogleAccount: (linkToken: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "vaja.auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());

  const applyAuth = useCallback((response: AuthResponse) => {
    const next = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user
    };
    persistAuth(next);
    setAuth(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      applyAuth(response);
    },
    [applyAuth]
  );

  const completeOAuth = useCallback((accessToken: string, refreshToken: string) => {
    const claims = decodeJwt(accessToken);
    const next = {
      accessToken,
      refreshToken,
      user: {
        id: String(claims.sub ?? "google-user"),
        email: String(claims.email ?? "google-user"),
        displayName: String(claims.email ?? "Google learner"),
        avatarUrl: null,
        role: String(claims.role ?? "STUDENT"),
        status: "ACTIVE"
      }
    };
    persistAuth(next);
    setAuth(next);
  }, []);

  const linkGoogleAccount = useCallback(
    async (linkToken: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/google/link", {
        method: "POST",
        body: { linkToken, password }
      });
      applyAuth(response);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { displayName, email, password }
      });
      applyAuth(response);
    },
    [applyAuth]
  );

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

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
