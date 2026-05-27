import { Chrome, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ApiError } from "../../shared/api";
import { IconTextButton, PrimaryButton } from "../../shared/components";
import { logoUrl } from "../../shared/assets";

const oauthBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL ?? "";

export function AuthView() {
  const { isAuthenticated, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("VAJA Learner");
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const target = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
    return <Navigate replace to={target} />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(displayName, email, password);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function startGoogleLogin() {
    window.location.assign(`${oauthBaseUrl}/oauth2/authorization/google`);
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <img src={logoUrl} alt="VAJA logo" />
        <div>
          <p className="eyebrow">VAJA</p>
          <h1>Learn Japanese with a tutor that remembers your progress.</h1>
          <p>
            Chat with context, review weak cards, take short assessments, and let the planner choose the next
            focused study block.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-label="Authentication">
        <div className="segmented-control">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form-stack">
          {mode === "register" && (
            <label>
              Display name
              <span className="input-shell">
                <UserRound size={18} />
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </span>
            </label>
          )}

          <label>
            Email
            <span className="input-shell">
              <Mail size={18} />
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>

          <label>
            Password
            <span className="input-shell">
              <LockKeyhole size={18} />
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading && <Loader2 className="spin" size={18} />}
            {mode === "login" ? "Login" : "Create account"}
          </PrimaryButton>
          <IconTextButton type="button" variant="ghost" onClick={startGoogleLogin}>
            <Chrome size={18} />
            Continue with Google
          </IconTextButton>
        </form>
      </section>
    </main>
  );
}
