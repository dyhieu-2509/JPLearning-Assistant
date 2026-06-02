import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  LogIn,
  Sparkles,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { homePathForUser } from "../../../shared/auth";
import { logoUrl } from "../../../shared/assets";
import { ChoiceCard, IconTextButton, InfoCard, PrimaryButton, TopicChip } from "../../../shared/components";

const productHighlights = [
  {
    icon: <Bot size={22} />,
    title: "Tutor remembers context",
    description: "Chat sessions, sources, weak skills, and recent topics feed the learner profile."
  },
  {
    icon: <Layers3 size={22} />,
    title: "Review adapts daily",
    description: "Flashcards and progress signals prioritize the knowledge that needs attention."
  },
  {
    icon: <CalendarCheck size={22} />,
    title: "Planner follows evidence",
    description: "Study plans use onboarding, assessment, chat, and mastery data instead of a generic roadmap."
  }
];

const previewRows = [
  { label: "Profile setup", value: "8 questions", icon: <Sparkles size={18} /> },
  { label: "JLPT focus", value: "N5-N4 MVP", icon: <ClipboardCheck size={18} /> },
  { label: "Study signal", value: "Daily plan", icon: <BarChart3 size={18} /> }
];

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
        <img className="landing-hero-mark" src={logoUrl} alt="" aria-hidden="true" />
        <div className="landing-copy">
          <p className="eyebrow">VAJA Learning Assistant</p>
          <h1>Personalized Japanese Tutor</h1>
          <p>
            VAJA starts with a short learner profile, then connects chat, flashcards, assessments, and study planning
            into one focused JLPT learning workspace.
          </p>
          <div className="chip-row">
            <TopicChip>JLPT N5-N4</TopicChip>
            <TopicChip>Knowledge Graph</TopicChip>
            <TopicChip>RAG Tutor</TopicChip>
            <TopicChip>Personalization First</TopicChip>
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
          <div className="landing-proof-row" aria-label="Product signals">
            <span>
              <CheckCircle2 size={17} />
              Pre-login personalization
            </span>
            <span>
              <CheckCircle2 size={17} />
              Google and system login
            </span>
            <span>
              <CheckCircle2 size={17} />
              Dashboard-ready MVP
            </span>
          </div>
        </div>
      </section>

      {choosingPath && (
        <section className="landing-conversion-band" aria-label="Choose learner path">
          <div className="landing-choice-copy">
            <p className="eyebrow">Get Started</p>
            <h2>Choose how you want to enter VAJA.</h2>
            <p>New learners answer the personalization quiz first. Current learners go straight to login.</p>
          </div>
          <div className="choice-grid landing-path-grid">
            <ChoiceCard
              label="New Learner"
              description="Answer 8 personalization questions first, then create an account or sign in with Google."
              selected={false}
              onClick={() => navigate("/onboarding")}
              icon={<UserPlus size={18} />}
            />
            <ChoiceCard
              label="Current Learner"
              description="Already have an account? Continue directly to the normal login flow."
              selected={false}
              onClick={() => navigate("/login?mode=login")}
              icon={<ArrowRight size={18} />}
            />
          </div>
        </section>
      )}

      <section id="about" className="landing-preview-section" aria-label="Product preview">
        <div className="landing-preview-copy">
          <p className="eyebrow">Learner workspace</p>
          <h2>Everything after onboarding uses the same profile.</h2>
          <p>
            The first 8 questions are not decorative. They become profile data that guides retrieval, tutoring,
            review scheduling, assessment focus, and planner recommendations.
          </p>
        </div>
        <div className="landing-product-preview" aria-label="VAJA dashboard preview">
          <div className="preview-topbar">
            <img src={logoUrl} alt="VAJA logo" />
            <div>
              <strong>VAJA Study Workspace</strong>
              <span>Personalized Japanese tutor</span>
            </div>
          </div>
          <div className="preview-metrics">
            {previewRows.map((item) => (
              <div className="preview-metric" key={item.label}>
                <span>{item.icon}</span>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
          <div className="preview-chat">
            <p>Today VAJA recommends grammar review, 12 due flashcards, and a short N4 reading drill.</p>
          </div>
        </div>
      </section>

      <section className="landing-highlight-grid" aria-label="VAJA product highlights">
        {productHighlights.map((item) => (
          <InfoCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
        ))}
      </section>
    </main>
  );
}
