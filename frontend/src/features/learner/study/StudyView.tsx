import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleX,
  ClipboardCheck,
  Layers3,
  Lock,
  MessageCircle,
  RotateCcw,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconTextButton, Panel, PrimaryButton, TopicChip } from "../../../shared/components";
import { passThreshold, studyLessons, type StudyLesson } from "./studyPath";

type LessonPhase = "learn" | "flashcards" | "quiz" | "result";

type LessonProgress = {
  bestScore: number;
  passed: boolean;
  completedAt?: string;
};

type StudyProgress = Record<string, LessonProgress>;

const storageKey = "vaja.studyPathProgress";

export function StudyView() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<StudyProgress>(() => readProgress());
  const firstOpenLesson = useMemo(() => firstUnlockedLesson(progress), [progress]);
  const [activeLessonId, setActiveLessonId] = useState(firstOpenLesson.id);
  const [phase, setPhase] = useState<LessonPhase>("learn");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    writeProgress(progress);
  }, [progress]);

  const activeIndex = studyLessons.findIndex((lesson) => lesson.id === activeLessonId);
  const lesson = studyLessons[activeIndex] ?? studyLessons[0];
  const lessonProgress = progress[lesson.id];
  const unlocked = isLessonUnlocked(activeIndex, progress);
  const answeredCount = lesson.questions.filter((question) => answers[question.id]).length;
  const currentCard = lesson.flashcards[cardIndex] ?? lesson.flashcards[0];
  const currentScore = lastScore ?? lessonProgress?.bestScore ?? 0;
  const nextLesson = studyLessons[activeIndex + 1] ?? null;

  function selectLesson(nextLessonId: string) {
    const nextIndex = studyLessons.findIndex((item) => item.id === nextLessonId);
    if (!isLessonUnlocked(nextIndex, progress)) {
      return;
    }
    setActiveLessonId(nextLessonId);
    resetLessonState("learn");
  }

  function resetLessonState(nextPhase: LessonPhase) {
    setPhase(nextPhase);
    setCardIndex(0);
    setFlipped(false);
    setAnswers({});
    setLastScore(null);
  }

  function startFlashcards() {
    resetLessonState("flashcards");
  }

  function nextCard() {
    setFlipped(false);
    if (cardIndex < lesson.flashcards.length - 1) {
      setCardIndex((current) => current + 1);
      return;
    }
    setPhase("quiz");
  }

  function submitQuiz() {
    const correct = lesson.questions.filter((question) => answers[question.id] === question.answer).length;
    const score = Math.round((correct / lesson.questions.length) * 100);
    setLastScore(score);
    setProgress((current) => ({
      ...current,
      [lesson.id]: {
        bestScore: Math.max(current[lesson.id]?.bestScore ?? 0, score),
        passed: Boolean(current[lesson.id]?.passed || score >= passThreshold),
        completedAt: score >= passThreshold ? new Date().toISOString() : current[lesson.id]?.completedAt
      }
    }));
    setPhase("result");
  }

  function goNextLesson() {
    if (!nextLesson) {
      return;
    }
    setActiveLessonId(nextLesson.id);
    resetLessonState("learn");
  }

  function resetPath() {
    setProgress({});
    setActiveLessonId(studyLessons[0].id);
    resetLessonState("learn");
  }

  return (
    <section className="study-path-page">
      <section className="study-path-hero">
        <div>
          <p className="eyebrow">Pathway học chính</p>
          <h2>Bấm vào là học, không phải tự ghép chức năng.</h2>
          <p>
            Mỗi bài gồm phần học ngắn, thẻ nhớ và quiz cuối bài. Đạt từ {passThreshold}% trở lên thì bài kế tiếp mới mở.
          </p>
        </div>
        <div className="study-path-score">
          <Trophy size={24} />
          <span>Tiến độ</span>
          <strong>{completedLessons(progress)}/{studyLessons.length}</strong>
        </div>
      </section>

      <div className="study-path-layout">
        <Panel className="study-lesson-rail" eyebrow="Bài học" title="Đường học">
          <div className="study-lesson-list">
            {studyLessons.map((item, index) => {
              const itemUnlocked = isLessonUnlocked(index, progress);
              const itemProgress = progress[item.id];
              return (
                <button
                  className={item.id === lesson.id ? "study-lesson-row active" : "study-lesson-row"}
                  disabled={!itemUnlocked}
                  key={item.id}
                  type="button"
                  onClick={() => selectLesson(item.id)}
                >
                  <span className="study-lesson-index">{itemProgress?.passed ? <CheckCircle2 size={16} /> : itemUnlocked ? index + 1 : <Lock size={15} />}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.level} · {item.focus}</small>
                  </span>
                  <em>{itemProgress?.passed ? "Đã qua" : itemUnlocked ? `${itemProgress?.bestScore ?? 0}%` : "Khóa"}</em>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          className="study-lesson-stage"
          eyebrow={`${lesson.level} · ${lesson.focus}`}
          title={lesson.title}
          action={<LessonPhaseBadge phase={phase} />}
        >
          {!unlocked ? (
            <LockedLesson previous={studyLessons[activeIndex - 1]} />
          ) : (
            <>
              {phase === "learn" && (
                <div className="study-learn-step">
                  <div className="study-pattern-card">
                    <TopicChip>Mẫu chính</TopicChip>
                    <strong>{lesson.pattern}</strong>
                    <p>{lesson.summary}</p>
                  </div>
                  <div className="study-example-card">
                    <span>{lesson.example}</span>
                    <small>{lesson.translation}</small>
                  </div>
                  <div className="study-action-row">
                    <PrimaryButton type="button" onClick={startFlashcards}>
                      <Layers3 size={18} />
                      Học thẻ của bài này
                    </PrimaryButton>
                    <IconTextButton type="button" variant="ghost" onClick={() => navigate("/learner/chat")}>
                      <MessageCircle size={18} />
                      Hỏi VAJA
                    </IconTextButton>
                  </div>
                </div>
              )}

              {phase === "flashcards" && currentCard && (
                <div className="study-flashcard-step">
                  <div className="study-step-meter">
                    <TopicChip>Thẻ {cardIndex + 1}/{lesson.flashcards.length}</TopicChip>
                    <TopicChip>{flipped ? "Mặt sau" : "Mặt trước"}</TopicChip>
                  </div>
                  <button className={flipped ? "study-flashcard flipped" : "study-flashcard"} type="button" onClick={() => setFlipped((current) => !current)}>
                    <strong>{flipped ? currentCard.back : currentCard.front}</strong>
                    <small>{flipped ? currentCard.hint : "Tự nhớ trước, rồi lật thẻ"}</small>
                  </button>
                  <div className="study-action-row">
                    <IconTextButton type="button" variant="ghost" disabled={cardIndex === 0} onClick={() => {
                      setFlipped(false);
                      setCardIndex((current) => Math.max(0, current - 1));
                    }}>
                      Quay lại
                    </IconTextButton>
                    <PrimaryButton type="button" onClick={nextCard}>
                      {cardIndex < lesson.flashcards.length - 1 ? "Thẻ tiếp theo" : "Làm quiz cuối bài"}
                      <ArrowRight size={18} />
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {phase === "quiz" && (
                <div className="study-quiz-step">
                  <div className="study-step-meter">
                    <TopicChip>{answeredCount}/{lesson.questions.length} câu đã chọn</TopicChip>
                    <TopicChip>Điểm qua bài: {passThreshold}%</TopicChip>
                  </div>
                  {lesson.questions.map((question, index) => (
                    <fieldset className="study-question" key={question.id}>
                      <legend>{index + 1}. {question.prompt}</legend>
                      <div className="study-option-grid">
                        {question.options.map((option) => (
                          <button
                            className={answers[question.id] === option ? "study-option selected" : "study-option"}
                            key={option}
                            type="button"
                            onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <PrimaryButton type="button" disabled={answeredCount < lesson.questions.length} onClick={submitQuiz}>
                    <ClipboardCheck size={18} />
                    Nộp quiz cuối bài
                  </PrimaryButton>
                </div>
              )}

              {phase === "result" && (
                <div className={currentScore >= passThreshold ? "study-result passed" : "study-result retry"}>
                  <Trophy size={36} />
                  <h3>{currentScore >= passThreshold ? "Qua bài rồi." : "Chưa qua bài này."}</h3>
                  <strong>{currentScore}%</strong>
                  <p>
                    {currentScore >= passThreshold
                      ? nextLesson
                        ? "Bài kế tiếp đã mở. Bạn có thể học tiếp ngay."
                        : "Bạn đã hoàn thành pathway hiện tại."
                      : `Cần đạt ít nhất ${passThreshold}%. Ôn lại thẻ rồi làm quiz lại nhé.`}
                  </p>
                  <div className="study-answer-review">
                    {lesson.questions.map((question) => {
                      const selected = answers[question.id];
                      const correct = selected === question.answer;
                      return (
                        <div className={correct ? "study-answer-row correct" : "study-answer-row wrong"} key={question.id}>
                          {correct ? <CheckCircle2 size={16} /> : <CircleX size={16} />}
                          <span>{question.explanation}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="study-action-row">
                    {currentScore >= passThreshold && nextLesson ? (
                      <PrimaryButton type="button" onClick={goNextLesson}>
                        Học bài tiếp theo
                        <ArrowRight size={18} />
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton type="button" onClick={startFlashcards}>
                        <RotateCcw size={18} />
                        Ôn lại bài này
                      </PrimaryButton>
                    )}
                    <IconTextButton type="button" variant="ghost" onClick={() => resetLessonState("quiz")}>
                      Làm lại quiz
                    </IconTextButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>

        <Panel className="study-support-panel" eyebrow="Công cụ phụ" title="Khi bị kẹt">
          <button type="button" onClick={() => navigate("/learner/knowledge")}>
            <BookOpenCheck size={18} />
            Tra mẫu câu đang học
          </button>
          <button type="button" onClick={() => navigate("/learner/flashcards")}>
            <Layers3 size={18} />
            Xem kho thẻ riêng
          </button>
          <button type="button" onClick={resetPath}>
            <RotateCcw size={18} />
            Làm lại pathway
          </button>
        </Panel>
      </div>
    </section>
  );
}

function LessonPhaseBadge({ phase }: { phase: LessonPhase }) {
  const labels: Record<LessonPhase, string> = {
    learn: "Học",
    flashcards: "Thẻ nhớ",
    quiz: "Quiz",
    result: "Kết quả"
  };
  return <TopicChip>{labels[phase]}</TopicChip>;
}

function LockedLesson({ previous }: { previous?: StudyLesson }) {
  return (
    <div className="study-locked">
      <Lock size={34} />
      <h3>Bài này đang khóa.</h3>
      <p>Hoàn thành {previous?.title ?? "bài trước"} với ít nhất {passThreshold}% để mở bài này.</p>
    </div>
  );
}

function readProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StudyProgress) : {};
  } catch {
    localStorage.removeItem(storageKey);
    return {};
  }
}

function writeProgress(progress: StudyProgress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function isLessonUnlocked(index: number, progress: StudyProgress): boolean {
  if (index <= 0) {
    return true;
  }
  return Boolean(progress[studyLessons[index - 1]?.id]?.passed);
}

function firstUnlockedLesson(progress: StudyProgress): StudyLesson {
  return (
    studyLessons.find((lesson, index) => isLessonUnlocked(index, progress) && !progress[lesson.id]?.passed) ??
    studyLessons[studyLessons.length - 1]
  );
}

function completedLessons(progress: StudyProgress): number {
  return studyLessons.filter((lesson) => progress[lesson.id]?.passed).length;
}
