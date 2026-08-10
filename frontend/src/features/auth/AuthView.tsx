import { BookOpenCheck, Chrome, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ApiError } from "../../shared/api";
import { IconTextButton, PrimaryButton } from "../../shared/components";
import { logoUrl } from "../../shared/assets";
import { googleOAuthStartUrl } from "../../shared/config";
import { homePathForUser } from "../../shared/auth";
import { hasOnboardingDraft, readOnboardingDraft, saveOAuthOnboardingMode } from "../../shared/onboardingDraft";

export function AuthView() {
  const { isAuthenticated, login, register, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onboardingDraft = readOnboardingDraft();
  const isZeroDraft = (onboardingDraft?.currentLevel ?? "").toUpperCase() === "ZERO";
  const requestedMode = params.get("mode") === "register" || isZeroDraft ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(requestedMode);
  const [displayName, setDisplayName] = useState("Người học VAJA");
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasDraft = params.get("onboarding") === "1" || hasOnboardingDraft();
  const draftMessage =
    isZeroDraft
      ? "Bạn đã học thử từ số 0. Hãy tạo tài khoản mới để lưu 3 bài chữ cái và tiếp tục pathway."
      : mode === "register"
      ? "8 câu làm quen đã được lưu tạm. VAJA sẽ đưa vào tài khoản mới sau khi bạn tạo tài khoản."
      : "Bạn đang đăng nhập tài khoản đã có. VAJA sẽ giữ lộ trình hiện tại. Muốn dùng 8 câu vừa chọn, hãy bấm Tạo tài khoản.";

  useEffect(() => {
    setMode(requestedMode);
  }, [requestedMode]);

  if (isAuthenticated) {
    const target = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? homePathForUser(user);
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
      setError(caught instanceof ApiError ? caught.message : "Không thể xác thực tài khoản");
    } finally {
      setLoading(false);
    }
  }

  function startGoogleLogin() {
    saveOAuthOnboardingMode(mode);
    window.location.assign(googleOAuthStartUrl);
  }

  function startGuestTrial() {
    navigate("/guest/study");
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <img src={logoUrl} alt="VAJA logo" />
        <div>
          <p className="eyebrow">VAJA</p>
          <h1>続けよう - tiếp tục học tiếng Nhật hôm nay.</h1>
          <p>
            Đăng nhập để mở lại bài học hôm nay, thẻ nhớ, bài thử nhanh và những phần bạn đang cần ôn.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-label="Đăng nhập VAJA">
        {isZeroDraft ? (
          <div className="segmented-control single">
            <button className="active" type="button" onClick={() => setMode("register")}>
              Tạo tài khoản mới
            </button>
          </div>
        ) : (
          <div className="segmented-control">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
              Đăng nhập
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => setMode("register")}
            >
              Tạo tài khoản
            </button>
          </div>
        )}

        <IconTextButton className="google-auth-button" type="button" variant="ghost" onClick={startGoogleLogin}>
          <Chrome size={18} />
          Tiếp tục với Google
        </IconTextButton>

        {isZeroDraft && (
          <IconTextButton className="guest-study-button" type="button" variant="ghost" onClick={startGuestTrial}>
            <BookOpenCheck size={18} />
            Học thử 3 bài không đăng nhập
          </IconTextButton>
        )}

        <form onSubmit={submit} className="form-stack">
          {mode === "register" && (
            <label>
              Tên hiển thị
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
            Mật khẩu
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
          {hasDraft && (
            <p className="form-success">
              {draftMessage}
            </p>
          )}

          <PrimaryButton type="submit" disabled={loading}>
            {loading && <Loader2 className="spin" size={18} />}
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </PrimaryButton>
        </form>
      </section>
    </main>
  );
}
