import { Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ApiError } from "../../shared/api";
import { IconTextButton } from "../../shared/components";

export function AuthCallbackView() {
  const [params] = useSearchParams();
  const { completeOAuth, isAuthenticated, linkGoogleAccount } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [loading, setLoading] = useState(false);

  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const linkToken = params.get("linkToken");
  const email = params.get("email");
  const needsLink = params.get("error") === "ACCOUNT_LINK_REQUIRED" && linkToken;

  useEffect(() => {
    if (accessToken && refreshToken) {
      completeOAuth(accessToken, refreshToken);
    }
  }, [accessToken, completeOAuth, refreshToken]);

  const message = useMemo(() => {
    if (needsLink) {
      return `Google email ${email ?? ""} already has a system account.`;
    }
    return "Finishing Google login...";
  }, [email, needsLink]);

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linkToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await linkGoogleAccount(linkToken, password);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Cannot link Google account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen compact-auth">
      <section className="auth-panel" aria-label="Google OAuth callback">
        <p className="eyebrow">Google OAuth2</p>
        <h1>{needsLink ? "Link your account" : "Signing in"}</h1>
        <p className="muted-copy">{message}</p>
        {needsLink ? (
          <form className="form-stack" onSubmit={submit}>
            <label>
              System password
              <span className="input-shell">
                <LockKeyhole size={18} />
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </span>
            </label>
            {error && <p className="form-error">{error}</p>}
            <IconTextButton type="submit" disabled={loading}>
              {loading && <Loader2 className="spin" size={18} />}
              Link Google
            </IconTextButton>
          </form>
        ) : (
          <>
            {error && <p className="form-error">{error}</p>}
            <div className="loading-inline">
              <Loader2 className="spin" size={20} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
