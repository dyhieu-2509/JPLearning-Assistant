import { BookOpenCheck, Brain, Clock3, Layers3, RefreshCw, Save, Target } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { LearnerDashboardResponse, StudentProfileResponse } from "../../../shared/models";
import { EmptyState, IconButton, IconTextButton, LoadingPanel, MetricTile, PageHeader, Panel, TopicChip } from "../../../shared/components";

const levelOptions = ["N5", "N4", "N3", "N2", "N1"];
const skillLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  kanji: "Kanji",
  listening: "Nghe",
  reading: "Đọc",
  speaking: "Nói"
};

const explanationStyleLabels: Record<string, string> = {
  concise: "Ngắn gọn",
  "step-by-step": "Từng bước",
  "example-first": "Ví dụ trước"
};

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
      setError(caught instanceof ApiError ? caught.message : "Không thể tải bảng học tập");
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
      setError(caught instanceof ApiError ? caught.message : "Không thể lưu hồ sơ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingPanel>Đang tải không gian học...</LoadingPanel>;
  }

  return (
    <section className="dashboard-grid">
      <PageHeader eyebrow="今日の学習" title="Tín hiệu học hôm nay" />

      {error && <div className="form-error full-span">{error}</div>}

      <MetricTile
        icon={<Brain size={22} />}
        label="Mức nắm vững"
        value={`${masteryPercent}%`}
        accent="sky"
      />
      <MetricTile
        icon={<Target size={22} />}
        label="Điểm yếu"
        value={String(dashboard?.progress.weakItems ?? 0)}
        accent="rose"
      />
      <MetricTile
        icon={<Layers3 size={22} />}
        label="Thẻ cần ôn"
        value={String(dashboard?.flashcards.dueCards ?? 0)}
        accent="amber"
      />
      <MetricTile
        icon={<BookOpenCheck size={22} />}
        label="Bài kiểm tra"
        value={String(dashboard?.assessments.completedSessions ?? 0)}
        accent="green"
      />

      <Panel
        className="profile-panel"
        eyebrow="Hồ sơ"
        title="Điều chỉnh cá nhân hóa"
        action={
          <IconButton onClick={loadDashboard} title="Làm mới bảng học tập">
            <RefreshCw size={18} />
          </IconButton>
        }
      >

        {profileForm && (
          <form className="profile-form" onSubmit={saveProfile}>
            <label>
              Hiện tại
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
              Mục tiêu
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
              Phút mỗi ngày
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
              Lý do học
              <input
                value={profileForm.goal}
                onChange={(event) => setProfileForm({ ...profileForm, goal: event.target.value })}
              />
            </label>
            <label>
              Cách giải thích
              <select
                value={profileForm.explanationStyle}
                onChange={(event) => setProfileForm({ ...profileForm, explanationStyle: event.target.value })}
              >
                <option value="concise">Ngắn gọn</option>
                <option value="step-by-step">Từng bước</option>
                <option value="example-first">Ví dụ trước</option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={profileForm.romajiEnabled}
                onChange={(event) => setProfileForm({ ...profileForm, romajiEnabled: event.target.checked })}
              />
              Gợi ý romaji
            </label>
            <IconTextButton className="wide-field" type="submit" disabled={saving}>
              <Save size={18} />
              Lưu hồ sơ
            </IconTextButton>
          </form>
        )}
      </Panel>

      <Panel eyebrow="知識レビュー" title="Phần cần ôn tiếp theo">
        <div className="stack-list">
          {dashboard?.progress.weakestItems.length ? (
            dashboard.progress.weakestItems.map((item) => (
              <div className="knowledge-row" key={item.id}>
                <div>
                  <strong>{item.title || item.knowledgeId}</strong>
                  <span>
                    {displaySkill(item.knowledgeType)} · {item.level || "JLPT"}
                  </span>
                </div>
                <progress max={1} value={item.masteryScore} />
              </div>
            ))
          ) : (
            <EmptyState compact>Chưa có điểm yếu nào được ghi nhận.</EmptyState>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Ngữ cảnh gần đây" title="Tín hiệu từ chat và kiểm tra">
        <div className="signal-grid">
          <SignalBlock label="Buổi chat" value={String(dashboard?.chat.sessionCount ?? 0)} />
          <SignalBlock label="Tin nhắn" value={String(dashboard?.chat.messageCount ?? 0)} />
          <SignalBlock
            label="Điểm TB"
            value={`${Math.round(dashboard?.assessments.averageScorePercent ?? 0)}%`}
          />
        </div>
        <div className="chip-row">
          {(dashboard?.chat.recentTopics.length ? dashboard.chat.recentTopics : ["grammar", "vocabulary"]).map(
            (topic) => (
              <TopicChip key={topic}>{displaySkill(topic)}</TopicChip>
            )
          )}
        </div>
      </Panel>

      <Panel eyebrow="学習時間" title="Mục tiêu mỗi ngày" action={<Clock3 size={22} />}>
        <div className="big-number">{dashboard?.profile.dailyStudyMinutes ?? 0} phút</div>
        <p className="muted-copy">{dashboard?.profile.goal || "Đặt mục tiêu JLPT để VAJA gợi ý lộ trình tốt hơn."}</p>
      </Panel>
    </section>
  );
}

function toProfileForm(profile: StudentProfileResponse): ProfileForm {
  return {
    currentLevel: profile.currentLevel ?? "N5",
    targetLevel: profile.targetLevel ?? "N4",
    goal: profile.goal ?? "Thi JLPT N4",
    dailyStudyMinutes: profile.dailyStudyMinutes || 30,
    explanationStyle: profile.explanationStyle ?? "concise",
    romajiEnabled: profile.romajiEnabled
  };
}

function displaySkill(value: string): string {
  return skillLabels[value.toLowerCase()] ?? explanationStyleLabels[value] ?? value;
}

function SignalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal-block">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
