import {
  Brain,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  ListChecks,
  MessageCircle,
  Target,
  WandSparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import {
  EmptyState,
  IconButton,
  IconTextButton,
  Panel,
  TopicChip
} from "../../../shared/components";
import type {
  LearnerDashboardResponse,
  PlannerContextResponse,
  PlannerRecommendationResponse,
  SavedStudyPlanResponse
} from "../../../shared/models";
import { learningPathwayLabel, learningPathwayOptions } from "../../../shared/pathways";

export function PlannerView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [currentLevel, setCurrentLevel] = useState("N5");
  const [targetLevel, setTargetLevel] = useState("N4");
  const [learningPathway, setLearningPathway] = useState("jlpt_foundation");
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(3);
  const [goal, setGoal] = useState("Thi JLPT N4 và nhớ ngữ pháp chắc hơn");
  const [dashboard, setDashboard] = useState<LearnerDashboardResponse | null>(null);
  const [recommendation, setRecommendation] = useState<PlannerRecommendationResponse | null>(null);
  const [plans, setPlans] = useState<SavedStudyPlanResponse[]>([]);
  const [activePlan, setActivePlan] = useState<SavedStudyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const context = recommendation?.context ?? null;
  const signalSummary = useMemo(() => buildSignalSummary(context, dashboard), [context, dashboard]);

  async function loadPlans(preferredPlanId?: string) {
    const data = await apiRequest<SavedStudyPlanResponse[]>("/planner/plans?limit=8", { token });
    setPlans(data);
    setActivePlan((current) => {
      const preferred = preferredPlanId ? data.find((plan) => plan.id === preferredPlanId) : null;
      if (preferred) {
        return preferred;
      }
      if (current) {
        return data.find((plan) => plan.id === current.id) ?? data[0] ?? null;
      }
      return data[0] ?? null;
    });
  }

  async function loadDashboard() {
    const data = await apiRequest<LearnerDashboardResponse>("/personalization/me/dashboard", { token });
    setDashboard(data);
    setCurrentLevel(data.profile.currentLevel ?? "N5");
    setTargetLevel(data.profile.targetLevel ?? "N4");
    setLearningPathway(data.profile.learningPathway ?? "jlpt_foundation");
    setGoal(data.profile.goal || "Thi JLPT N4 và nhớ ngữ pháp chắc hơn");
    setWeeklyStudyHours(minutesPerDayToWeeklyHours(data.profile.dailyStudyMinutes));
  }

  async function loadInitialData() {
    setError(null);
    try {
      const results = await Promise.allSettled([loadPlans(), loadDashboard()]);
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) {
        setError("Chưa tải đủ lịch sử học. Bạn vẫn có thể tạo kế hoạch từ thông tin hiện có.");
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải lộ trình");
    }
  }

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function recommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<PlannerRecommendationResponse>("/planner/recommend", {
        method: "POST",
        token,
        body: { currentLevel, targetLevel, learningPathway, weeklyStudyHours, goal }
      });
      setRecommendation(data);
      await loadPlans(data.planId);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tạo lộ trình");
    } finally {
      setLoading(false);
    }
  }

  async function complete(planId: string, itemId: string) {
    setError(null);
    try {
      const updated = await apiRequest<SavedStudyPlanResponse>(`/planner/plans/${planId}/items/${itemId}/complete`, {
        method: "POST",
        token
      });
      setActivePlan(updated);
      await loadPlans(updated.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể hoàn thành mục học");
    }
  }

  return (
    <section className="learning-grid planner-workspace">
      <div className="section-heading full-span">
        <p className="eyebrow">学習計画</p>
        <h2>Kế hoạch học vừa sức tuần này</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <Panel className="planner-form-panel" eyebrow="Gợi ý" title="Tuần này học gì?" action={<WandSparkles size={21} />}>
        <form className="profile-form single" onSubmit={recommend}>
          <label>
            Hiện tại
            <select value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
            </select>
          </label>
          <label>
            Mục tiêu
            <select value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
            </select>
          </label>
          <label>
            Pathway
            <select value={learningPathway} onChange={(event) => setLearningPathway(event.target.value)}>
              {learningPathwayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Giờ học mỗi tuần
            <input
              min={1}
              max={40}
              type="number"
              value={weeklyStudyHours}
              onChange={(event) => setWeeklyStudyHours(Number(event.target.value))}
            />
          </label>
          <label>
            Lý do học
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} />
          </label>
            <IconTextButton type="submit" disabled={loading}>
              <CalendarCheck size={18} />
            {loading ? "Đang xếp bài..." : "Xếp kế hoạch học"}
            </IconTextButton>
        </form>
      </Panel>

      <Panel className="focus-panel planner-active-panel" eyebrow="Đang học" title={activePlan ? `${activePlan.level} → ${activePlan.targetLevel}` : "Chưa có lộ trình"} action={<ListChecks size={21} />}>
        {activePlan ? (
          <div className="plan-stack">
            <div className="plan-progress planner-progress-card">
              <strong>{Math.round(activePlan.completionRate)}%</strong>
              <progress max={100} value={activePlan.completionRate} />
              <span>
                {activePlan.completedItems}/{activePlan.totalItems} mục hoàn thành
              </span>
            </div>
            <p className="muted-copy">{activePlan.goal}</p>
            {activePlan.items.map((item) => (
              <div className={item.completed ? "plan-item done" : "plan-item"} key={item.id}>
                <div>
                  <strong>
                    {item.order}. {item.title}
                  </strong>
                  <span>
                    {item.objective} · {item.estimatedHours}h
                  </span>
                </div>
                <IconButton
                  type="button"
                  disabled={item.completed}
                  title="Đánh dấu hoàn thành"
                  onClick={() => void complete(activePlan.id, item.id)}
                >
                  <CheckCircle2 size={18} />
                </IconButton>
              </div>
            ))}
          </div>
        ) : recommendation ? (
          <div className="plan-stack">
            {recommendation.items.map((item) => (
              <div className="plan-item" key={`${item.order}-${item.title}`}>
                <div>
                  <strong>
                    {item.order}. {item.title}
                  </strong>
                  <span>
                    {item.objective} · {item.estimatedHours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState compact>Bấm xếp kế hoạch để VAJA chia nhỏ việc học trong tuần.</EmptyState>
        )}
      </Panel>

      <Panel eyebrow="Gợi ý ôn" title={context ? "Dựa vào bài bạn vừa học" : "Dựa vào nhịp học hiện tại"} action={<Brain size={21} />}>
        <div className="planner-signal-grid">
          {signalSummary.map((signal) => (
            <div className="planner-signal-card" key={signal.label}>
              <span>{signal.icon}</span>
              <strong>{signal.value}</strong>
              <small>{signal.label}</small>
            </div>
          ))}
        </div>
        <div className="planner-context-list">
          {context?.weakProgress?.slice(0, 3).map((item) => (
            <TopicChip key={`${item.knowledgeType}-${item.knowledgeId}`}>{item.title || item.knowledgeId}</TopicChip>
          ))}
          {context?.recentChatTopics?.slice(0, 3).map((topic) => <TopicChip key={topic}>{topic}</TopicChip>)}
          {!context && dashboard?.assessments.recentWeakAreas.slice(0, 3).map((area) => <TopicChip key={area}>{area}</TopicChip>)}
        </div>
        <p className="muted-copy">
          VAJA xếp bài từ thẻ cần ôn, phần hay quên, bài thử gần nhất và câu hỏi bạn vừa hỏi. Bạn chỉ cần làm từng mục trong tuần.
        </p>
      </Panel>

      <Panel eyebrow="Lịch sử" title="Lộ trình đã lưu">
        <div className="stack-list">
          {plans.map((plan) => (
            <button
              className={activePlan?.id === plan.id ? "session-button active" : "session-button"}
              key={plan.id}
              type="button"
              onClick={() => setActivePlan(plan)}
            >
              <strong>{plan.goal}</strong>
              <span>
                {plan.completedItems}/{plan.totalItems} mục · {Math.round(plan.completionRate)}%
              </span>
            </button>
          ))}
          {!plans.length && <EmptyState compact>Chưa có lộ trình nào.</EmptyState>}
        </div>
      </Panel>
    </section>
  );
}

function minutesPerDayToWeeklyHours(minutes?: number | null): number {
  if (!minutes) {
    return 3;
  }
  return Math.max(1, Math.round((minutes * 7) / 60));
}

function buildSignalSummary(context: PlannerContextResponse | null, dashboard: LearnerDashboardResponse | null) {
  return [
    {
      icon: <Target size={18} />,
      label: "Mục tiêu",
      value: context?.profile?.targetLevel ?? dashboard?.profile.targetLevel ?? "N4"
    },
    {
      icon: <CalendarCheck size={18} />,
      label: "Pathway",
      value: learningPathwayLabel(context?.profile?.learningPathway ?? dashboard?.profile.learningPathway)
    },
    {
      icon: <Layers3 size={18} />,
      label: "Thẻ đến hạn",
      value: String(context?.dueFlashcards?.length ?? dashboard?.flashcards.dueCards ?? 0)
    },
    {
      icon: <Brain size={18} />,
      label: "Phần cần ôn",
      value: String(context?.weakProgress?.length ?? dashboard?.progress.weakItems ?? 0)
    },
    {
      icon: <ClipboardCheck size={18} />,
      label: "Bài thử gần đây",
      value: context?.recentAssessment
        ? `${context.recentAssessment.score}/${context.recentAssessment.total}`
        : dashboard?.assessments.latest
          ? `${dashboard.assessments.latest.score}/${dashboard.assessments.latest.total}`
          : "Chưa làm"
    },
    {
      icon: <MessageCircle size={18} />,
      label: "Chủ đề đã hỏi",
      value: String(context?.recentChatTopics?.length ?? dashboard?.chat.recentTopics.length ?? 0)
    }
  ];
}
