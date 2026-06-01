import { BookOpenCheck, Brain, Clock3, Layers3, RefreshCw, Save, Target } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { LearnerDashboardResponse, StudentProfileResponse } from "../../../shared/models";
import { EmptyState, IconButton, IconTextButton, LoadingPanel, MetricTile, PageHeader, Panel, TopicChip } from "../../../shared/components";

const levelOptions = ["N5", "N4", "N3", "N2", "N1"];

type ProfileForm = {
  currentLevel: string;
  targetLevel: string;
  goal: string;
  dailyStudyMinutes: number;
  explanationStyle: string;
  romajiEnabled: boolean;
};

export function DashboardView() {
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
    return <LoadingPanel>Loading learner workspace...</LoadingPanel>;
  }

  return (
    <section className="dashboard-grid">
      <PageHeader eyebrow="Learner dashboard" title="Today’s study signal" />

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

      <Panel
        className="profile-panel"
        eyebrow="Profile"
        title="Personalization controls"
        action={
          <IconButton onClick={loadDashboard} title="Refresh dashboard">
            <RefreshCw size={18} />
          </IconButton>
        }
      >

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
            <IconTextButton className="wide-field" type="submit" disabled={saving}>
              <Save size={18} />
              Save profile
            </IconTextButton>
          </form>
        )}
      </Panel>

      <Panel eyebrow="Weak knowledge" title="Next review targets">
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
            <EmptyState compact>No weak items recorded yet.</EmptyState>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Recent context" title="Chat and assessment signals">
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
              <TopicChip key={topic}>{topic}</TopicChip>
            )
          )}
        </div>
      </Panel>

      <Panel eyebrow="Study time" title="Daily target" action={<Clock3 size={22} />}>
        <div className="big-number">{dashboard?.profile.dailyStudyMinutes ?? 0} min</div>
        <p className="muted-copy">{dashboard?.profile.goal || "Set a JLPT goal to improve planner quality."}</p>
      </Panel>
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

function SignalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal-block">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
