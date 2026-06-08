import { Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ApiError } from "../../shared/api";
import { homePathForUser } from "../../shared/auth";
import { IconTextButton } from "../../shared/components";

export function AuthCallbackView() {
  const [params] = useSearchParams();
  const { completeOAuth, isAuthenticated, linkGoogleAccount, user } = useAuth();
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
      void completeOAuth(accessToken, refreshToken);
    }
  }, [accessToken, completeOAuth, refreshToken]);

  const message = useMemo(() => {
    if (needsLink) {
      return `Email Google ${email ?? ""} đã có tài khoản hệ thống.`;
    }
    return "Đang hoàn tất đăng nhập Google...";
  }, [email, needsLink]);

  if (isAuthenticated) {
    return <Navigate replace to={homePathForUser(user)} />;
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
      setError(caught instanceof ApiError ? caught.message : "Không thể liên kết Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen compact-auth">
      <section className="auth-panel" aria-label="Hoàn tất Google OAuth">
        <p className="eyebrow">Google OAuth2</p>
        <h1>{needsLink ? "Liên kết tài khoản" : "Đang đăng nhập"}</h1>
        <p className="muted-copy">{message}</p>
        {needsLink ? (
          <form className="form-stack" onSubmit={submit}>
            <label>
              Mật khẩu hệ thống
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
              Liên kết Google
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
