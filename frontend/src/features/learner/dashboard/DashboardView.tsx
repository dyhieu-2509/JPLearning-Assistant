import { BookOpenCheck, Brain, CalendarCheck, ClipboardCheck, Layers3, MessageCircle, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { LearnerDashboardResponse } from "../../../shared/models";
import { EmptyState, LoadingPanel, MetricTile, PageHeader, Panel, PrimaryButton, TopicChip } from "../../../shared/components";

const skillLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  kanji: "Kanji",
  listening: "Nghe",
  reading: "Đọc",
  speaking: "Nói"
};

export function DashboardView() {
  const { accessToken } = useAuth();
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
      setError(caught instanceof ApiError ? caught.message : "Chưa kết nối được dữ liệu học mới nhất");
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

  if (loading) {
    return <LoadingPanel>Đang tải không gian học...</LoadingPanel>;
  }

  const dueCards = dashboard?.flashcards.dueCards ?? 0;
  const weakItems = dashboard?.progress.weakItems ?? 0;
  const dailyMinutes = dashboard?.profile.dailyStudyMinutes ?? 15;
  const currentLevel = dashboard?.profile.currentLevel ?? "N5";
  const targetLevel = dashboard?.profile.targetLevel ?? "N4";
  const studySteps = [
    {
      icon: <ClipboardCheck size={20} />,
      label: "Làm thử 5 câu",
      text: "Bài ngắn giúp biết hôm nay nên ôn từ vựng, ngữ pháp hay kanji.",
      to: "/learner/assessment",
      status: weakItems ? `${weakItems} phần cần luyện` : "Nên làm trước"
    },
    {
      icon: <Layers3 size={20} />,
      label: "Ôn thẻ đến hạn",
      text: "Tự nhớ trước, lật đáp án, rồi chọn mức nhớ thật của bạn.",
      to: "/learner/flashcards",
      status: dueCards ? `${dueCards} thẻ` : "Có thể tạo bộ mới"
    },
    {
      icon: <Search size={20} />,
      label: "Tra cứu nhanh",
      text: "Tìm từ vựng, ngữ pháp, kanji N5/N4 khi gặp điểm chưa hiểu.",
      to: "/learner/knowledge",
      status: "N5/N4"
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Hỏi khi bí",
      text: "Hỏi bằng tiếng Việt khi cần ví dụ, so sánh mẫu câu hoặc hiểu lỗi sai.",
      to: "/learner/chat",
      status: "Giải thích"
    }
  ];

  return (
    <section className="dashboard-grid">
      <PageHeader eyebrow="今日の学習" title="Hôm nay mình học gì?" />

      {error && <div className="learning-note full-span">{error}. Bạn vẫn có thể làm bài thử hoặc ôn thẻ trước.</div>}

      <section className="today-learning-panel full-span">
        <div className="today-copy">
          <p className="eyebrow">Bài học hôm nay</p>
          <h2>Học khoảng {dailyMinutes} phút, mỗi lần một việc nhỏ.</h2>
          <p>
            Bắt đầu bằng bài thử ngắn, ôn phần hay quên, tra cứu khi cần và hỏi VAJA nếu bạn bị kẹt.
          </p>
          <div className="chip-row">
            <TopicChip>{currentLevel} → {targetLevel}</TopicChip>
            <TopicChip>{masteryPercent}% mức nhớ</TopicChip>
            <TopicChip>{dueCards} thẻ cần ôn</TopicChip>
          </div>
          <PrimaryButton type="button" onClick={() => navigate("/learner/assessment")}>
            <ClipboardCheck size={18} />
            Làm bài thử ngay
          </PrimaryButton>
        </div>
        <div className="today-path" aria-label="Lộ trình học hôm nay">
          {studySteps.map((step, index) => (
            <button className="study-step-card" key={step.label} type="button" onClick={() => navigate(step.to)}>
              <span className="study-step-index">{index + 1}</span>
              <span className="study-step-icon">{step.icon}</span>
              <strong>{step.label}</strong>
              <small>{step.text}</small>
              <em>{step.status}</em>
            </button>
          ))}
        </div>
      </section>

      <MetricTile
        icon={<Brain size={22} />}
        label="Mức nhớ"
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
        label="Lượt kiểm tra"
        value={String(dashboard?.assessments.completedSessions ?? 0)}
        accent="green"
      />

      <Panel className="profile-panel" eyebrow="復習" title="Phần nên xem lại">
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
            <EmptyState compact>Chưa thấy phần nào cần ôn lại. Làm bài thử để VAJA xếp bài tốt hơn.</EmptyState>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Gần đây" title="Bạn vừa học gì?">
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

      <Panel eyebrow="学習計画" title="Kế hoạch tuần này" action={<CalendarCheck size={22} />}>
        <div className="big-number">{dailyMinutes} phút</div>
        <p className="muted-copy">{dashboard?.profile.goal || "Làm bài thử để có kế hoạch học vừa sức hơn."}</p>
        <PrimaryButton type="button" onClick={() => navigate("/learner/planner")}>
          <CalendarCheck size={18} />
          Xem lộ trình
        </PrimaryButton>
      </Panel>
    </section>
  );
}

function displaySkill(value: string): string {
  return skillLabels[value.toLowerCase()] ?? value;
}

function SignalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="signal-block">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
