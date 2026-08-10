import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardCheck, Layers3, Play, RotateCcw, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
import type { AssessmentStartResponse, AssessmentSubmitResponse, StudentProfileResponse } from "../../../shared/models";
import { buildStudyChapters, chapterAssessmentQuestionCount, type StudyChapter } from "../study/studyPath";

export function AssessmentView() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const token = accessToken ?? "";
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [level, setLevel] = useState("N5");
  const [category, setCategory] = useState("vocabulary");
  const [questionCount, setQuestionCount] = useState(chapterAssessmentQuestionCount);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [session, setSession] = useState<AssessmentStartResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chapters = useMemo(() => buildStudyChapters(profile), [profile]);
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0] ?? null;
  const currentQuestion = session?.questions[activeIndex] ?? null;
  const answeredCount = useMemo(
    () => (session ? session.questions.filter((question) => answers[question.id]).length : 0),
    [answers, session]
  );
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : "";
  const hasStarted = Boolean(session);
  const hasAnsweredAll = Boolean(session && answeredCount === session.questions.length);
  const scorePercent = result ? Math.round((result.score / Math.max(result.total, 1)) * 100) : 0;
  const needsReview = Boolean(result && (result.score < result.total || result.weakAreas.length > 0));

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    apiRequest<StudentProfileResponse>("/personalization/me/profile", { token: accessToken })
      .then((data) => {
        if (active) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (active) {
          setProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedChapter && chapters.length) {
      applyChapter(chapters[0]);
    }
  }, [chapters, selectedChapter]);

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
        body: { level, category, questionCount: normalizedQuestionCount(questionCount) }
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

  function prepareNextChallenge() {
    resetSession();
    if (selectedChapter) {
      const nextIndex = chapters.findIndex((chapter) => chapter.id === selectedChapter.id) + 1;
      const nextChapter = chapters[nextIndex];
      if (nextChapter) {
        applyChapter(nextChapter);
        return;
      }
    }
    setQuestionCount(chapterAssessmentQuestionCount);
    setLevel("N4");
  }

  function applyChapter(chapter: StudyChapter) {
    setSelectedChapterId(chapter.id);
    setLevel(chapter.level);
    setCategory(assessmentCategoryForChapter(chapter));
    setQuestionCount(chapterAssessmentQuestionCount);
  }

  return (
    <section className="learning-grid assessment-workspace">
      <div className="section-heading full-span">
        <p className="eyebrow">確認テスト</p>
        <h2>Test lớn theo chương</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <Panel className="assessment-setup-card" eyebrow="Bắt đầu" title="Chọn test theo pathway" action={<ClipboardCheck size={21} />}>
        <div className="assessment-chapter-grid" aria-label="Chương trong pathway">
          {chapters.slice(0, 8).map((chapter, index) => (
            <button
              className={chapter.id === selectedChapter?.id ? "assessment-chapter-card active" : "assessment-chapter-card"}
              key={chapter.id}
              type="button"
              onClick={() => applyChapter(chapter)}
              disabled={loading}
            >
              <span>Chương {index + 1}</span>
              <strong>{cleanChapterTitle(chapter.title)}</strong>
              <small>{chapter.level} · {displayCategory(assessmentCategoryForChapter(chapter))} · 20 câu</small>
            </button>
          ))}
        </div>

        <form className="profile-form single" onSubmit={start}>
          <label>
            Trình độ
            <select value={level} onChange={(event) => setLevel(event.target.value)} disabled={loading}>
              <option>N5</option>
              <option>N4</option>
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
              min={10}
              max={20}
              type="number"
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              disabled={loading}
            />
          </label>
          <IconTextButton type="submit" disabled={loading}>
            <Play size={18} />
            {hasStarted ? "Tạo test mới" : "Bắt đầu test 20 câu"}
          </IconTextButton>
        </form>

        <div className="assessment-status-list" aria-label="Cách VAJA dùng bài kiểm tra">
          <span>
            <CheckCircle2 size={17} />
            Luồng Học bắt buộc qua test chương trước khi mở chương mới.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Màn này cho bạn luyện hoặc làm lại test lớn theo pathway.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Kết quả được lưu về mastery để VAJA biết phần nào cần ôn.
          </span>
        </div>
      </Panel>

      <Panel
        className="focus-panel quiz-shell"
        eyebrow="Bài làm"
        title={result ? "Bài đã nộp" : session ? `${session.level} · ${displayCategory(session.category)}` : selectedChapter ? cleanChapterTitle(selectedChapter.title) : "Chưa có lượt kiểm tra"}
        action={session ? <ProgressMeter current={answeredCount} total={session.questions.length} /> : undefined}
      >
        {result ? (
          <div className="quiz-complete-card">
            <CheckCircle2 size={34} />
            <h3>Đã xong lượt kiểm tra này.</h3>
            <p>Bạn đạt {result.score}/{result.total}. Nếu đang ở luồng Học, hãy quay lại đó để VAJA mở chương đúng theo tiến độ.</p>
            <div className="next-action-grid">
              {needsReview ? (
                <>
                  <IconTextButton type="button" onClick={() => navigate("/learner/flashcards")}>
                    <Layers3 size={18} />
                    Ôn phần sai bằng thẻ
                  </IconTextButton>
                  <IconTextButton type="button" variant="ghost" onClick={() => navigate("/learner/study")}>
                    <BookOpenCheck size={18} />
                    Về luồng học
                  </IconTextButton>
                </>
              ) : (
                <IconTextButton type="button" onClick={prepareNextChallenge}>
                  <ArrowRight size={18} />
                  Tăng độ khó
                </IconTextButton>
              )}
              <IconTextButton type="button" variant="ghost" onClick={resetSession}>
                <RotateCcw size={18} />
                Làm lượt khác
              </IconTextButton>
            </div>
          </div>
        ) : currentQuestion ? (
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
            Chọn chương ở bên trái. Mỗi test có 20 câu và được dùng như bài kiểm tra lớn cuối chương.
          </EmptyState>
        )}
      </Panel>

      <Panel
        eyebrow="Kết quả"
        title={result ? (needsReview ? "Mình nên ôn lại phần sai" : "Bạn có thể tăng độ khó") : "Sau khi nộp bài"}
        action={<CheckCircle2 size={21} />}
      >
        {result ? (
          <div className="result-stack assessment-result-stack">
            <div className={needsReview ? "assessment-score-card review" : "assessment-score-card success"}>
              <span>Điểm</span>
              <strong>
                {result.score}/{result.total}
              </strong>
              <small>{scorePercent}% chính xác</small>
            </div>
            <p className="assessment-result-guidance">
              {needsReview
                ? "Các phần sai sẽ được đưa vào thẻ nhớ và kế hoạch ôn gần nhất."
                : "Bạn chưa tạo điểm yếu mới ở lượt này. Không cần đổi lộ trình ôn; nên tăng độ khó hoặc học tiếp bài mới."}
            </p>
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
            {needsReview ? (
              <div className="next-action-grid">
                <IconTextButton type="button" onClick={() => navigate("/learner/flashcards")}>
                  <Layers3 size={18} />
                  Ôn phần sai bằng thẻ
                </IconTextButton>
                <IconTextButton type="button" variant="ghost" onClick={() => navigate("/learner/study")}>
                  <BookOpenCheck size={18} />
                  Về luồng học
                </IconTextButton>
                <IconTextButton type="button" variant="ghost" onClick={resetSession}>
                  <RotateCcw size={18} />
                  Làm lượt khác
                </IconTextButton>
              </div>
            ) : (
              <div className="next-action-grid">
                <IconTextButton type="button" onClick={prepareNextChallenge}>
                  <ArrowRight size={18} />
                  Tăng độ khó
                </IconTextButton>
                <IconTextButton type="button" variant="ghost" onClick={() => navigate("/learner")}>
                  <CheckCircle2 size={18} />
                  Về trang học
                </IconTextButton>
                <IconTextButton type="button" variant="ghost" onClick={resetSession}>
                  <RotateCcw size={18} />
                  Làm lượt khác
                </IconTextButton>
              </div>
            )}
          </div>
        ) : (
          <EmptyState compact>
            Điểm test lớn giúp VAJA biết phần nào cần ôn thêm. Muốn mở chương mới, hãy làm test ngay trong luồng Học.
          </EmptyState>
        )}
      </Panel>
    </section>
  );
}

function normalizedQuestionCount(value: number): number {
  return Math.min(20, Math.max(10, Number.isFinite(value) ? value : chapterAssessmentQuestionCount));
}

function assessmentCategoryForChapter(chapter: StudyChapter): string {
  const text = `${chapter.focus} ${chapter.title} ${chapter.description}`.toLowerCase();
  if (text.includes("kanji") || text.includes("chữ hán")) {
    return "kanji";
  }
  if (text.includes("ngữ pháp") || text.includes("grammar") || text.includes("trợ từ") || text.includes("mẫu")) {
    return "grammar";
  }
  return "vocabulary";
}

function cleanChapterTitle(value: string): string {
  return value.replace(/^Chương\s+\d+:\s*/i, "");
}

function displayCategory(value: string): string {
  const labels: Record<string, string> = {
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    kanji: "Kanji"
  };
  return labels[value.toLowerCase()] ?? value;
}
