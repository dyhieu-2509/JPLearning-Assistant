import { BookOpenCheck, Layers3, Search, Sparkles } from "lucide-react";
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
  const dailyMinutes = dashboard?.profile.dailyStudyMinutes ?? 15;
  const currentLevel = dashboard?.profile.currentLevel ?? "N5";
  const targetLevel = dashboard?.profile.targetLevel ?? "N4";
  const pathwayLabel = learningPathwayLabel(dashboard?.profile.learningPathway);
  const completedSessions = dashboard?.assessments.completedSessions ?? 0;
  const averageScore = Math.round(dashboard?.assessments.averageScorePercent ?? 0);
  const learnerName = user?.displayName?.trim().split(" ")[0] || "bạn";
  const memoryLabel = masteryPercent >= 70 ? "Khá chắc" : masteryPercent >= 35 ? "Đang quen dần" : "Mới bắt đầu";
  const reviewLabel = dueCards ? `${dueCards} thẻ đang chờ` : "Chưa có thẻ đến hạn";
  const hasRecentActivity = Boolean(completedSessions || dueCards || dashboard?.progress.weakestItems.length);

  const studySteps = [
    {
      icon: <BookOpenCheck size={20} />,
      label: "Học một bài trọn vẹn",
      text: `Bài học gồm giải thích ngắn, flashcard và quiz cuối bài. Đạt từ 85% thì mở bài tiếp theo.`,
      to: "/learner/study",
      status: "Luồng chính"
    },
    {
      icon: <Layers3 size={20} />,
      label: dueCards ? "Ôn thẻ riêng" : "Kho thẻ riêng",
      text: "Dùng khi muốn ôn thêm ngoài bài chính hoặc xem lại các thẻ đã lưu.",
      to: "/learner/flashcards",
      status: reviewLabel
    },
    {
      icon: <Search size={20} />,
      label: "Tra cứu khi bí",
      text: "Tìm nhanh mẫu câu, từ vựng hoặc kanji N5/N4 nếu gặp phần chưa hiểu.",
      to: "/learner/knowledge",
      status: `${currentLevel}/${targetLevel}`
    }
  ];

  return (
    <section className="friendly-dashboard">
      <section className="friendly-hero">
        <div className="friendly-hero-copy">
          <p className="eyebrow">今日の学習</p>
          <h2>Chào {learnerName}, hôm nay mình học nhẹ thôi.</h2>
          <p>
            Dành khoảng {dailyMinutes} phút cho một bài nhỏ: học mẫu câu, lật thẻ nhớ, rồi làm quiz cuối bài.
            Đạt từ 85% thì bài tiếp theo sẽ mở.
          </p>
          <div className="friendly-hero-actions">
            <PrimaryButton type="button" onClick={() => navigate("/learner/study")}>
              <BookOpenCheck size={18} />
              Học bài hôm nay
            </PrimaryButton>
            <button className="friendly-secondary-action" type="button" onClick={() => navigate("/learner/flashcards")}>
              Ôn thẻ riêng
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
            <p className="eyebrow">Luồng chính</p>
            <h3>Bấm một chỗ để học, ôn thẻ và làm quiz.</h3>
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

      <Panel className="friendly-side-panel" eyebrow="Pathway của bạn" title="Bài học chính của bạn" action={<BookOpenCheck size={22} />}>
        <div className="friendly-mini-stats">
          <MiniStat label="Thời lượng mỗi ngày" value={`${dailyMinutes} phút`} />
          <MiniStat label="Pathway" value={pathwayLabel} />
          <MiniStat label="Bài kiểm tra đã làm" value={completedSessions ? `${completedSessions} lượt` : "Chưa làm"} />
          <MiniStat label="Điểm gần đây" value={completedSessions ? `${averageScore}%` : "Đợi bài đầu tiên"} />
        </div>
        <p className="muted-copy">
          {dashboard?.profile.goal || "Bài học tiếp theo đã được xếp theo câu trả lời mở đầu và tiến độ gần nhất của bạn."}
        </p>
        <PrimaryButton type="button" onClick={() => navigate("/learner/study")}>
          <BookOpenCheck size={18} />
          Tiếp tục học
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
              <MiniStat label="Bài kiểm tra" value={String(completedSessions)} />
              <MiniStat label="Mục cần ôn" value={String(dashboard?.progress.weakItems ?? 0)} />
              <MiniStat label="Thẻ cần ôn" value={String(dueCards)} />
            </div>
            {dashboard?.progress.weakestItems.length ? (
              <div className="chip-row">
                {dashboard.progress.weakestItems.slice(0, 3).map((item) => (
                  <TopicChip key={item.id}>{displaySkill(item.knowledgeType)}</TopicChip>
                ))}
              </div>
            ) : null}
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
