import { CheckCircle2, ClipboardCheck, Play, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { AssessmentStartResponse, AssessmentSubmitResponse } from "../../../shared/models";

export function AssessmentView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [level, setLevel] = useState("N5");
  const [category, setCategory] = useState("vocabulary");
  const [questionCount, setQuestionCount] = useState(5);
  const [session, setSession] = useState<AssessmentStartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
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
    if (!session) {
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

  return (
    <section className="learning-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">確認テスト</p>
        <h2>Đánh giá lại cá nhân hóa</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bắt đầu</p>
            <h3>Bài kiểm tra cá nhân hóa</h3>
          </div>
          <ClipboardCheck size={21} />
        </div>
        <form className="profile-form single" onSubmit={start}>
          <label>
            Trình độ
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
              <option>N3</option>
            </select>
          </label>
          <label>
            Nhóm kiến thức
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="vocabulary">Từ vựng</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="kanji">Kanji</option>
            </select>
          </label>
          <label>
            Số câu
            <input
              min={1}
              max={20}
              type="number"
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
            />
          </label>
          <button className="icon-text-button" type="submit" disabled={loading}>
            <Play size={18} />
            Bắt đầu kiểm tra
          </button>
        </form>
      </section>

      <section className="workspace-panel focus-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Câu hỏi</p>
            <h3>{session ? `${session.level} · ${displayCategory(session.category)}` : "Chưa có lượt kiểm tra"}</h3>
          </div>
        </div>
        {session ? (
          <div className="question-stack">
            {session.questions.map((question, index) => (
              <fieldset className="question-block" key={question.id}>
                <legend>
                  {index + 1}. {question.prompt}
                </legend>
                {question.options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers({ ...answers, [question.id]: option })}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
            <button
              className="primary-button"
              type="button"
              disabled={loading || Object.keys(answers).length === 0}
              onClick={() => void submit()}
            >
              Nộp bài
            </button>
          </div>
        ) : (
          <div className="empty-state compact">Làm bài kiểm tra để VAJA cập nhật tín hiệu cá nhân hóa.</div>
        )}
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Kết quả</p>
            <h3>Tín hiệu cá nhân hóa</h3>
          </div>
        </div>
        {result ? (
          <div className="result-stack">
            <div className="big-number">
              {result.score}/{result.total}
            </div>
            <div className="chip-row">
              {result.weakAreas.map((area) => (
                <span className="topic-chip" key={area}>
                  {area}
                </span>
              ))}
            </div>
            {result.results.map((item) => (
              <div className="result-row" key={item.questionId}>
                {item.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{item.explanation || `${item.selectedAnswer} → ${item.correctAnswer}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">Kết quả sẽ được dùng làm tín hiệu cá nhân hóa đáng tin cậy hơn.</div>
        )}
      </section>
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
