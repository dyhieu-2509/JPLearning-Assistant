import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardCheck, Layers3, Play, RotateCcw, XCircle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import {
  EmptyState,
  IconTextButton,
  Panel,
  PrimaryButton,
  ProgressMeter,
  TopicChip
} from "../../../shared/components";
import type { AssessmentStartResponse, AssessmentSubmitResponse } from "../../../shared/models";

export function AssessmentView() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const token = accessToken ?? "";
  const [level, setLevel] = useState("N5");
  const [category, setCategory] = useState("vocabulary");
  const [questionCount, setQuestionCount] = useState(5);
  const [session, setSession] = useState<AssessmentStartResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = session?.questions[activeIndex] ?? null;
  const answeredCount = useMemo(
    () => (session ? session.questions.filter((question) => answers[question.id]).length : 0),
    [answers, session]
  );
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : "";
  const hasStarted = Boolean(session);
  const hasAnsweredAll = Boolean(session && answeredCount === session.questions.length);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setActiveIndex(0);

    try {
      const data = await apiRequest<AssessmentStartResponse>("/assessment/sessions", {
        method: "POST",
        token,
        body: { level, category, questionCount }
      });
      setSession(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể bắt đầu bài kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!session || !hasAnsweredAll) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AssessmentSubmitResponse>(`/assessment/sessions/${session.sessionId}/submit`, {
        method: "POST",
        token,
        body: { answers }
      });
      setResult(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể nộp bài kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  function chooseAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function resetSession() {
    setSession(null);
    setResult(null);
    setAnswers({});
    setActiveIndex(0);
    setError(null);
  }

  return (
    <section className="learning-grid assessment-workspace">
      <div className="section-heading full-span">
        <p className="eyebrow">確認テスト</p>
        <h2>Kiểm tra ngắn để VAJA chỉnh bài học</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <Panel className="assessment-setup-card" eyebrow="Bắt đầu" title="Chọn bài kiểm tra" action={<ClipboardCheck size={21} />}>
        <form className="profile-form single" onSubmit={start}>
          <label>
            Trình độ
            <select value={level} onChange={(event) => setLevel(event.target.value)} disabled={loading}>
              <option>N5</option>
              <option>N4</option>
              <option>N3</option>
            </select>
          </label>
          <label>
            Nhóm kiến thức
            <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={loading}>
              <option value="vocabulary">Từ vựng</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="kanji">Kanji</option>
            </select>
          </label>
          <label>
            Số câu
            <input
              min={3}
              max={10}
              type="number"
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              disabled={loading}
            />
          </label>
          <IconTextButton type="submit" disabled={loading}>
            <Play size={18} />
            {hasStarted ? "Tạo lượt mới" : "Bắt đầu kiểm tra"}
          </IconTextButton>
        </form>

        <div className="assessment-status-list" aria-label="Cách VAJA dùng bài kiểm tra">
          <span>
            <CheckCircle2 size={17} />
            Kết quả đúng/sai mới được tính vào mastery.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Chủ đề sai sẽ chuyển sang ôn thẻ và lộ trình.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Nên làm ngắn, đều, không cần học dồn.
          </span>
        </div>
      </Panel>

      <Panel
        className="focus-panel quiz-shell"
        eyebrow="Bài làm"
        title={session ? `${session.level} · ${displayCategory(session.category)}` : "Chưa có lượt kiểm tra"}
        action={session ? <ProgressMeter current={answeredCount} total={session.questions.length} /> : undefined}
      >
        {currentQuestion ? (
          <div className="quiz-question-card">
            <div className="quiz-question-meta">
              <TopicChip>Câu {activeIndex + 1}/{session?.questions.length ?? 0}</TopicChip>
              {selectedAnswer ? <TopicChip>Đã chọn</TopicChip> : <TopicChip>Chưa chọn</TopicChip>}
            </div>
            <h3>{currentQuestion.prompt}</h3>
            <div className="quiz-option-list" role="radiogroup" aria-label="Đáp án">
              {currentQuestion.options.map((option) => (
                <button
                  className={selectedAnswer === option ? "quiz-option selected" : "quiz-option"}
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selectedAnswer === option}
                  onClick={() => chooseAnswer(currentQuestion.id, option)}
                >
                  <span>{option}</span>
                </button>
              ))}
            </div>
            <div className="quiz-nav">
              <IconTextButton
                type="button"
                variant="ghost"
                disabled={activeIndex === 0 || loading}
                onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
              >
                Quay lại
              </IconTextButton>
              {activeIndex < (session?.questions.length ?? 0) - 1 ? (
                <PrimaryButton
                  type="button"
                  disabled={!selectedAnswer || loading}
                  onClick={() => setActiveIndex((current) => current + 1)}
                >
                  Câu tiếp theo
                  <ArrowRight size={18} />
                </PrimaryButton>
              ) : (
                <PrimaryButton type="button" disabled={!hasAnsweredAll || loading} onClick={() => void submit()}>
                  Nộp bài
                  <CheckCircle2 size={18} />
                </PrimaryButton>
              )}
            </div>
          </div>
        ) : (
          <EmptyState compact>
            Chọn bài kiểm tra ngắn ở bên trái. Mỗi lượt chỉ vài câu để bạn biết hôm nay nên ôn gì.
          </EmptyState>
        )}
      </Panel>

      <Panel eyebrow="Kết quả" title={result ? "VAJA đã cập nhật tín hiệu" : "Sau khi nộp bài"} action={<CheckCircle2 size={21} />}>
        {result ? (
          <div className="result-stack assessment-result-stack">
            <div className="assessment-score-card">
              <span>Điểm</span>
              <strong>
                {result.score}/{result.total}
              </strong>
              <small>{Math.round((result.score / Math.max(result.total, 1)) * 100)}% chính xác</small>
            </div>
            <div className="chip-row">
              {result.weakAreas.length ? (
                result.weakAreas.map((area) => <TopicChip key={area}>{area}</TopicChip>)
              ) : (
                <TopicChip>Không có điểm yếu mới</TopicChip>
              )}
            </div>
            {result.results.map((item, index) => (
              <div className={item.correct ? "result-row correct" : "result-row wrong"} key={item.questionId}>
                {item.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>
                  Câu {index + 1}: {item.explanation || `${item.selectedAnswer} → ${item.correctAnswer}`}
                </span>
              </div>
            ))}
            <div className="next-action-grid">
              <IconTextButton type="button" onClick={() => navigate("/learner/flashcards")}>
                <Layers3 size={18} />
                Ôn bằng thẻ
              </IconTextButton>
              <IconTextButton type="button" variant="ghost" onClick={() => navigate("/learner/planner")}>
                <CalendarCheck size={18} />
                Xem lộ trình
              </IconTextButton>
              <IconTextButton type="button" variant="ghost" onClick={resetSession}>
                <RotateCcw size={18} />
                Làm lượt khác
              </IconTextButton>
            </div>
          </div>
        ) : (
          <EmptyState compact>
            Điểm kiểm tra là tín hiệu đáng tin cậy nhất để cá nhân hóa. Chat và tra cứu chỉ ghi nhận là đã tiếp xúc kiến thức.
          </EmptyState>
        )}
      </Panel>
    </section>
  );
}

function displayCategory(value: string): string {
  const labels: Record<string, string> = {
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    kanji: "Kanji"
  };
  return labels[value.toLowerCase()] ?? value;
}
