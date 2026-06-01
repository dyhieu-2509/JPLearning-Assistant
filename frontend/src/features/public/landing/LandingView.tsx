import { ArrowRight, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { homePathForUser } from "../../../shared/auth";
import { logoUrl } from "../../../shared/assets";
import { ChoiceCard, IconTextButton, PrimaryButton, TopicChip } from "../../../shared/components";

export function LandingView() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [choosingPath, setChoosingPath] = useState(false);

  if (isAuthenticated) {
    return <Navigate replace to={homePathForUser(user)} />;
  }

  return (
    <main className="landing-screen">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">VAJA Japanese tutor</p>
          <h1>Học tiếng Nhật với lộ trình được cá nhân hóa từ phút đầu tiên.</h1>
          <p>
            VAJA hỏi nhanh vài tín hiệu học tập trước khi đăng nhập để chatbot, flashcard, assessment và planner dùng
            cùng một learner profile.
          </p>
          <div className="chip-row">
            <TopicChip>JLPT N5-N4</TopicChip>
            <TopicChip>Knowledge Graph</TopicChip>
            <TopicChip>Personalized Tutor</TopicChip>
          </div>
          <div className="landing-actions">
            <PrimaryButton type="button" onClick={() => setChoosingPath(true)}>
              <Sparkles size={18} />
              Get Started
            </PrimaryButton>
            <IconTextButton type="button" variant="ghost" onClick={() => navigate("/login?mode=login")}>
              <LogIn size={18} />
              Current Learner
            </IconTextButton>
          </div>
        </div>
        <div className="landing-logo-panel">
          <img src={logoUrl} alt="VAJA logo" />
        </div>
      </section>

      {choosingPath && (
        <section className="landing-choice-panel" aria-label="Choose learner path">
          <div>
            <p className="eyebrow">Choose your path</p>
            <h2>Bạn bắt đầu mới hay đã có tài khoản?</h2>
          </div>
          <div className="choice-grid">
            <ChoiceCard
              label="New Learner"
              description="Làm 8 câu trắc nghiệm cá nhân trước, sau đó tạo tài khoản hoặc đăng nhập Google."
              selected={false}
              onClick={() => navigate("/onboarding")}
              icon={<UserPlus size={18} />}
            />
            <ChoiceCard
              label="Current Learner"
              description="Bỏ qua onboarding trước đăng nhập và vào màn hình đăng nhập bình thường."
              selected={false}
              onClick={() => navigate("/login?mode=login")}
              icon={<ArrowRight size={18} />}
            />
          </div>
        </section>
      )}
    </main>
  );
}
