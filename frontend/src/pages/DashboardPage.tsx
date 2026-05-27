import { BookOpenCheck, Brain, Clock3, Layers3, RefreshCw, Save, Target } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError, LearnerDashboardResponse, StudentProfileResponse } from "../api";
import { useAuth } from "../auth";

const levelOptions = ["N5", "N4", "N3", "N2", "N1"];

type ProfileForm = {
  currentLevel: string;
  targetLevel: string;
  goal: string;
  dailyStudyMinutes: number;
  explanationStyle: string;
  romajiEnabled: boolean;
};

export function DashboardPage() {
  const { accessToken } = useAuth();
  const [dashboard, setDashboard] = useState<LearnerDashboardResponse | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = accessToken ?? "";

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LearnerDashboardResponse>("/personalization/me/dashboard", { token });
      setDashboard(data);
      setProfileForm(toProfileForm(data.profile));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Cannot load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const masteryPercent = useMemo(() => {
    const score = dashboard?.progress.averageMasteryScore ?? 0;
    return Math.round(score * 100);
  }, [dashboard]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileForm) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const profile = await apiRequest<StudentProfileResponse>("/personalization/me/profile", {
        method: "PUT",
        token,
        body: {
          currentLevel: profileForm.currentLevel,
          targetLevel: profileForm.targetLevel,
          goal: profileForm.goal,
          dailyStudyMinutes: Number(profileForm.dailyStudyMinutes),
          explanationStyle: profileForm.explanationStyle,
          romajiEnabled: profileForm.romajiEnabled,
          weakSkills: dashboard?.profile.weakSkills ?? []
        }
      });
      setDashboard((current) => (current ? { ...current, profile } : current));
      setProfileForm(toProfileForm(profile));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Cannot save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="loading-panel">Loading learner workspace...</div>;
  }

  return (
    <section className="dashboard-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">Learner dashboard</p>
        <h2>Today’s study signal</h2>
      </div>

      {error && <div className="form-error full-span">{error}</div>}

      <MetricTile
        icon={<Brain size={22} />}
        label="Average mastery"
        value={`${masteryPercent}%`}
        accent="sky"
      />
      <MetricTile
        icon={<Target size={22} />}
        label="Weak items"
        value={String(dashboard?.progress.weakItems ?? 0)}
        accent="rose"
      />
      <MetricTile
        icon={<Layers3 size={22} />}
        label="Cards due"
        value={String(dashboard?.flashcards.dueCards ?? 0)}
        accent="amber"
      />
      <MetricTile
        icon={<BookOpenCheck size={22} />}
        label="Assessments"
        value={String(dashboard?.assessments.completedSessions ?? 0)}
        accent="green"
      />

      <section className="workspace-panel profile-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Personalization controls</h3>
          </div>
          <button className="icon-button" type="button" onClick={loadDashboard} title="Refresh dashboard">
            <RefreshCw size={18} />
          </button>
        </div>

        {profileForm && (
          <form className="profile-form" onSubmit={saveProfile}>
            <label>
              Current
              <select
                value={profileForm.currentLevel}
                onChange={(event) => setProfileForm({ ...profileForm, currentLevel: event.target.value })}
              >
                {levelOptions.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label>
              Target
              <select
                value={profileForm.targetLevel}
                onChange={(event) => setProfileForm({ ...profileForm, targetLevel: event.target.value })}
              >
                {levelOptions.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label>
              Daily minutes
              <input
                min={5}
                max={480}
                type="number"
                value={profileForm.dailyStudyMinutes}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, dailyStudyMinutes: Number(event.target.value) })
                }
              />
            </label>
            <label className="wide-field">
              Goal
              <input
                value={profileForm.goal}
                onChange={(event) => setProfileForm({ ...profileForm, goal: event.target.value })}
              />
            </label>
            <label>
              Explain style
              <select
                value={profileForm.explanationStyle}
                onChange={(event) => setProfileForm({ ...profileForm, explanationStyle: event.target.value })}
              >
                <option value="concise">concise</option>
                <option value="step-by-step">step-by-step</option>
                <option value="example-first">example-first</option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={profileForm.romajiEnabled}
                onChange={(event) => setProfileForm({ ...profileForm, romajiEnabled: event.target.checked })}
              />
              Romaji hints
            </label>
            <button className="icon-text-button wide-field" type="submit" disabled={saving}>
              <Save size={18} />
              Save profile
            </button>
          </form>
        )}
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Weak knowledge</p>
            <h3>Next review targets</h3>
          </div>
        </div>
        <div className="stack-list">
          {dashboard?.progress.weakestItems.length ? (
            dashboard.progress.weakestItems.map((item) => (
              <div className="knowledge-row" key={item.id}>
                <div>
                  <strong>{item.title || item.knowledgeId}</strong>
                  <span>
                    {item.knowledgeType} · {item.level || "JLPT"}
                  </span>
                </div>
                <progress max={1} value={item.masteryScore} />
              </div>
            ))
          ) : (
            <div className="empty-state compact">No weak items recorded yet.</div>
          )}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent context</p>
            <h3>Chat and assessment signals</h3>
          </div>
        </div>
        <div className="signal-grid">
          <SignalBlock label="Chat sessions" value={String(dashboard?.chat.sessionCount ?? 0)} />
          <SignalBlock label="Messages" value={String(dashboard?.chat.messageCount ?? 0)} />
          <SignalBlock
            label="Avg score"
            value={`${Math.round(dashboard?.assessments.averageScorePercent ?? 0)}%`}
          />
        </div>
        <div className="chip-row">
          {(dashboard?.chat.recentTopics.length ? dashboard.chat.recentTopics : ["grammar", "vocabulary"]).map(
            (topic) => (
              <span className="topic-chip" key={topic}>
                {topic}
              </span>
            )
          )}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Study time</p>
            <h3>Daily target</h3>
          </div>
          <Clock3 size={22} />
        </div>
        <div className="big-number">{dashboard?.profile.dailyStudyMinutes ?? 0} min</div>
        <p className="muted-copy">{dashboard?.profile.goal || "Set a JLPT goal to improve planner quality."}</p>
      </section>
    </section>
  );
}

function toProfileForm(profile: StudentProfileResponse): ProfileForm {
  return {
    currentLevel: profile.currentLevel ?? "N5",
    targetLevel: profile.targetLevel ?? "N4",
    goal: profile.goal ?? "Pass JLPT N4",
    dailyStudyMinutes: profile.dailyStudyMinutes || 30,
    explanationStyle: profile.explanationStyle ?? "concise",
    romajiEnabled: profile.romajiEnabled
  };
}

function MetricTile({
  icon,
  label,
  value,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "sky" | "green" | "amber" | "rose";
}) {
  return (
    <div className={`metric-tile ${accent}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function SignalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal-block">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
