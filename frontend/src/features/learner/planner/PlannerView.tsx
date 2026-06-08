import { CalendarCheck, CheckCircle2, ListChecks, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { PlannerRecommendationResponse, SavedStudyPlanResponse } from "../../../shared/models";

export function PlannerView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [currentLevel, setCurrentLevel] = useState("N5");
  const [targetLevel, setTargetLevel] = useState("N4");
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(5);
  const [goal, setGoal] = useState("Thi JLPT N4 và nhớ ngữ pháp chắc hơn");
  const [recommendation, setRecommendation] = useState<PlannerRecommendationResponse | null>(null);
  const [plans, setPlans] = useState<SavedStudyPlanResponse[]>([]);
  const [activePlan, setActivePlan] = useState<SavedStudyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPlans() {
    setError(null);
    try {
      const data = await apiRequest<SavedStudyPlanResponse[]>("/planner/plans?limit=8", { token });
      setPlans(data);
      setActivePlan((current) => current ?? data[0] ?? null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải lộ trình");
    }
  }

  useEffect(() => {
    void loadPlans();
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
        body: { currentLevel, targetLevel, weeklyStudyHours, goal }
      });
      setRecommendation(data);
      await loadPlans();
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
      await loadPlans();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể hoàn thành mục học");
    }
  }

  return (
    <section className="learning-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">学習計画</p>
        <h2>Kế hoạch tự học</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Gợi ý</p>
            <h3>Tuần này học gì?</h3>
          </div>
          <WandSparkles size={21} />
        </div>
        <form className="profile-form single" onSubmit={recommend}>
          <label>
            Hiện tại
            <select value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
              <option>N3</option>
            </select>
          </label>
          <label>
            Mục tiêu
            <select value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)}>
              <option>N4</option>
              <option>N3</option>
              <option>N2</option>
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
          <button className="icon-text-button" type="submit" disabled={loading}>
            <CalendarCheck size={18} />
            Gợi ý lộ trình
          </button>
        </form>
      </section>

      <section className="workspace-panel focus-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Đang học</p>
            <h3>{activePlan ? `${activePlan.level} → ${activePlan.targetLevel}` : "Chưa có lộ trình"}</h3>
          </div>
          <ListChecks size={21} />
        </div>
        {activePlan ? (
          <div className="plan-stack">
            <div className="plan-progress">
              <strong>{Math.round(activePlan.completionRate)}%</strong>
              <progress max={100} value={activePlan.completionRate} />
            </div>
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
                <button
                  className="icon-button"
                  type="button"
                  disabled={item.completed}
                  title="Đánh dấu hoàn thành"
                  onClick={() => void complete(activePlan.id, item.id)}
                >
                  <CheckCircle2 size={18} />
                </button>
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
          <div className="empty-state compact">Bấm gợi ý lộ trình để VAJA chia nhỏ việc học trong tuần.</div>
        )}
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Lịch sử</p>
            <h3>Lộ trình đã lưu</h3>
          </div>
        </div>
        <div className="stack-list">
          {plans.map((plan) => (
            <button className="session-button" key={plan.id} type="button" onClick={() => setActivePlan(plan)}>
              <strong>{plan.goal}</strong>
              <span>
                {plan.completedItems}/{plan.totalItems} mục · {Math.round(plan.completionRate)}%
              </span>
            </button>
          ))}
          {!plans.length && <div className="empty-state compact">Chưa có lộ trình nào.</div>}
        </div>
      </section>
    </section>
  );
}
