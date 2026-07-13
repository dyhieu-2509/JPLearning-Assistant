import { CalendarCheck, ClipboardCheck, Layers3, MessageCircle, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import { logoUrl } from "../../../shared/assets";
import { EmptyState, LoadingPanel, Panel, PrimaryButton, TopicChip } from "../../../shared/components";
import type { LearnerDashboardResponse } from "../../../shared/models";
import { learningPathwayLabel } from "../../../shared/pathways";

const skillLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  kanji: "Kanji",
  listening: "Nghe",
  reading: "Đọc",
  speaking: "Nói"
};

export function DashboardView() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<LearnerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = accessToken ?? "";

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LearnerDashboardResponse>("/personalization/me/dashboard", { token });
      setDashboard(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Chưa tải được dữ liệu học mới nhất");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingPanel>Đang mở góc học hôm nay...</LoadingPanel>;
  }

  const masteryPercent = Math.round((dashboard?.progress.averageMasteryScore ?? 0) * 100);
  const dueCards = dashboard?.flashcards.dueCards ?? 0;
  const weakItems = dashboard?.progress.weakItems ?? 0;
  const dailyMinutes = dashboard?.profile.dailyStudyMinutes ?? 15;
  const currentLevel = dashboard?.profile.currentLevel ?? "N5";
  const targetLevel = dashboard?.profile.targetLevel ?? "N4";
  const pathwayLabel = learningPathwayLabel(dashboard?.profile.learningPathway);
  const completedSessions = dashboard?.assessments.completedSessions ?? 0;
  const averageScore = Math.round(dashboard?.assessments.averageScorePercent ?? 0);
  const recentTopics = dashboard?.chat.recentTopics.length ? dashboard.chat.recentTopics : ["grammar", "vocabulary"];
  const learnerName = user?.displayName?.trim().split(" ")[0] || "bạn";
  const memoryLabel = masteryPercent >= 70 ? "Khá chắc" : masteryPercent >= 35 ? "Đang quen dần" : "Mới bắt đầu";
  const reviewLabel = dueCards ? `${dueCards} thẻ đang chờ` : "Chưa có thẻ đến hạn";
  const hasRecentActivity = Boolean((dashboard?.chat.sessionCount ?? 0) || (dashboard?.chat.messageCount ?? 0) || dueCards);

  const studySteps = [
    {
      icon: <ClipboardCheck size={20} />,
      label: "Làm thử 5 câu",
      text: "Khởi động ngắn để biết hôm nay nên ôn từ vựng, ngữ pháp hay kanji.",
      to: "/learner/assessment",
      status: weakItems ? `${weakItems} phần cần luyện` : "Nên làm trước"
    },
    {
      icon: <Layers3 size={20} />,
      label: dueCards ? "Ôn thẻ đang chờ" : "Tạo bộ thẻ đầu tiên",
      text: "Tự nhớ trước, lật đáp án, rồi chọn mức nhớ thật của bạn.",
      to: "/learner/flashcards",
      status: reviewLabel
    },
    {
      icon: <Search size={20} />,
      label: "Tra cứu khi bí",
      text: "Tìm nhanh mẫu câu, từ vựng hoặc kanji N5/N4 khi đang học.",
      to: "/learner/knowledge",
      status: `${currentLevel}/${targetLevel}`
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Hỏi VAJA",
      text: "Hỏi bằng tiếng Việt để được giải thích bằng ví dụ dễ hiểu.",
      to: "/learner/chat",
      status: "Hỏi bài"
    }
  ];

  return (
    <section className="friendly-dashboard">
      <section className="friendly-hero">
        <div className="friendly-hero-copy">
          <p className="eyebrow">今日の学習</p>
          <h2>Chào {learnerName}, hôm nay mình học nhẹ thôi.</h2>
          <p>
            Dành khoảng {dailyMinutes} phút cho một việc nhỏ: làm thử vài câu, ôn lại phần hay quên,
            rồi hỏi khi bị kẹt.
          </p>
          <div className="friendly-hero-actions">
            <PrimaryButton type="button" onClick={() => navigate("/learner/assessment")}>
              <ClipboardCheck size={18} />
              Bắt đầu bài hôm nay
            </PrimaryButton>
            <button className="friendly-secondary-action" type="button" onClick={() => navigate("/learner/planner")}>
              Xem lộ trình tuần
            </button>
          </div>
        </div>
        <div className="friendly-progress-card" aria-label="Tóm tắt nhịp học">
          <div className="friendly-buddy">
            <img src={logoUrl} alt="" />
            <span>
              <Sparkles size={18} />
              VAJA nhắc nhỏ
            </span>
          </div>
          <strong>{memoryLabel}</strong>
          <p>
            {pathwayLabel} · {currentLevel} → {targetLevel} · {reviewLabel}
          </p>
          <div className="friendly-progress-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(Math.max(masteryPercent, 8), 100)}%` }} />
          </div>
        </div>
      </section>

      {error && (
        <div className="learning-note friendly-note full-span">
          Mình chưa lấy được bài mới nhất. Cứ bắt đầu bằng bài thử ngắn hoặc ôn thẻ trước nhé.
        </div>
      )}

      <section className="friendly-lesson-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bài học hôm nay</p>
            <h3>Đi từng bước, không cần học quá nhiều.</h3>
          </div>
        </div>
        <div className="friendly-step-list" aria-label="Các bước học hôm nay">
          {studySteps.map((step, index) => (
            <button className="friendly-step-row" key={step.label} type="button" onClick={() => navigate(step.to)}>
              <span className="friendly-step-icon">{step.icon}</span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.text}</small>
              </span>
              <em>{index + 1}. {step.status}</em>
            </button>
          ))}
        </div>
      </section>

      <Panel className="friendly-side-panel" eyebrow="Tuần này" title="Giữ nhịp vừa sức" action={<CalendarCheck size={22} />}>
        <div className="friendly-mini-stats">
          <MiniStat label="Thời lượng mỗi ngày" value={`${dailyMinutes} phút`} />
          <MiniStat label="Pathway" value={pathwayLabel} />
          <MiniStat label="Bài kiểm tra đã làm" value={completedSessions ? `${completedSessions} lượt` : "Chưa làm"} />
          <MiniStat label="Điểm gần đây" value={completedSessions ? `${averageScore}%` : "Đợi bài đầu tiên"} />
        </div>
        <p className="muted-copy">
          {dashboard?.profile.goal || "Làm bài thử đầu tiên để VAJA xếp lại bài học cho hợp sức hơn."}
        </p>
        <PrimaryButton type="button" onClick={() => navigate("/learner/planner")}>
          <CalendarCheck size={18} />
          Xem kế hoạch
        </PrimaryButton>
      </Panel>

      <Panel className="friendly-review-panel" eyebrow="Ôn lại" title="Phần nên xem lại">
        <div className="friendly-review-list">
          {dashboard?.progress.weakestItems.length ? (
            dashboard.progress.weakestItems.slice(0, 4).map((item) => (
              <button className="friendly-review-row" key={item.id} type="button" onClick={() => navigate("/learner/knowledge")}>
                <span>
                  <strong>{item.title || item.knowledgeId}</strong>
                  <small>
                    {displaySkill(item.knowledgeType)} · {item.level || "JLPT"}
                  </small>
                </span>
                <progress max={1} value={item.masteryScore} />
              </button>
            ))
          ) : (
            <EmptyState compact>Làm thử vài câu, phần cần ôn sẽ hiện ở đây.</EmptyState>
          )}
        </div>
      </Panel>

      <Panel className="friendly-recent-panel" eyebrow="Gần đây" title="Bạn vừa học gì?">
        {hasRecentActivity ? (
          <>
            <div className="friendly-recent-grid">
              <MiniStat label="Buổi hỏi bài" value={String(dashboard?.chat.sessionCount ?? 0)} />
              <MiniStat label="Tin nhắn" value={String(dashboard?.chat.messageCount ?? 0)} />
              <MiniStat label="Thẻ cần ôn" value={String(dueCards)} />
            </div>
            <div className="chip-row">
              {recentTopics.map((topic) => (
                <TopicChip key={topic}>{displaySkill(topic)}</TopicChip>
              ))}
            </div>
          </>
        ) : (
          <EmptyState compact>Sau buổi học đầu tiên, VAJA sẽ ghi lại chủ đề bạn vừa học ở đây.</EmptyState>
        )}
      </Panel>
    </section>
  );
}

function displaySkill(value: string): string {
  return skillLabels[value.toLowerCase()] ?? value;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="friendly-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
