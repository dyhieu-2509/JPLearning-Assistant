import {
  ArrowRight,
  Bot,
  BookOpenCheck,
  CheckCircle2,
  CircleX,
  ClipboardCheck,
  Layers3,
  Lightbulb,
  Loader2,
  Lock,
  RotateCcw,
  Target,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import { IconTextButton, LoadingPanel, Panel, PrimaryButton, TopicChip } from "../../../shared/components";
import { displayLearningLevel } from "../../../shared/levels";
import type { ChatResponse, StudentProfileResponse } from "../../../shared/models";
import { StudyFeedbackPrompt } from "../feedback/StudyFeedbackPrompt";
import {
  buildStudyChapters,
  flattenStudyChapters,
  passThreshold,
  studyPathwayIntro,
  weakSkillSummary,
  type StudyChapter,
  type StudyLesson,
  type StudyProfile,
  type StudyQuestion
} from "./studyPath";

type LessonPhase = "learn" | "flashcards" | "quiz" | "review" | "result";
type AdaptivePace = "support" | "steady" | "fast";

type LessonProgress = {
  bestScore: number;
  passed: boolean;
  attempts?: number;
  failCount?: number;
  lastScore?: number;
  recentScores?: number[];
  completedAt?: string;
};

type StudyProgress = Record<string, LessonProgress>;

type AdaptiveState = {
  pace: AdaptivePace;
  label: string;
  summary: string;
  target: string;
  detail: string;
};

type TutorInsight = {
  answer: string;
  confidence: number;
  sessionId: string;
  sources: Array<{ type: string; id: string; title: string }>;
};

type TutorNudgeDetail = {
  id: string;
  title: string;
  preview: string;
  message: string;
  actionLabel: string;
  contextTopic: string;
};

const lessonPhaseSteps: Array<{ phase: Exclude<LessonPhase, "result">; label: string; hint: string }> = [
  { phase: "learn", label: "Học", hint: "Mẫu câu" },
  { phase: "flashcards", label: "Thẻ", hint: "Tự nhớ" },
  { phase: "quiz", label: "Quiz", hint: "85% qua" },
  { phase: "review", label: "Tutor", hint: "Sửa sai" }
];

export function StudyView() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const chapters = useMemo(() => buildStudyChapters(profile), [profile]);
  const lessons = useMemo(() => flattenStudyChapters(chapters), [chapters]);
  const intro = useMemo(() => studyPathwayIntro(profile), [profile]);
  const progressKey = useMemo(() => studyStorageKey(user?.id, profile), [profile, user?.id]);
  const [progress, setProgress] = useState<StudyProgress>(() => readProgress("vaja.studyPathProgress.default"));
  const firstOpenLesson = useMemo(() => firstUnlockedLesson(progress, lessons), [lessons, progress]);
  const [activeLessonId, setActiveLessonId] = useState(firstOpenLesson.id);
  const [phase, setPhase] = useState<LessonPhase>("learn");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastSubmittedAnswers, setLastSubmittedAnswers] = useState<Record<string, string>>({});
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [tutorInsight, setTutorInsight] = useState<TutorInsight | null>(null);
  const [loadingTutorInsight, setLoadingTutorInsight] = useState(false);
  const [tutorInsightError, setTutorInsightError] = useState<string | null>(null);
  const [activeSupportQuestionId, setActiveSupportQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoadingProfile(false);
      return;
    }

    let active = true;
    setLoadingProfile(true);
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
      })
      .finally(() => {
        if (active) {
          setLoadingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    const nextProgress = readProgress(progressKey);
    setProgress(nextProgress);
    setActiveLessonId(firstUnlockedLesson(nextProgress, lessons).id);
    setPhase("learn");
    setCardIndex(0);
    setFlipped(false);
    setAnswers({});
    setLastScore(null);
    setActiveSupportQuestionId(null);
  }, [lessons, progressKey]);

  useEffect(() => {
    writeProgress(progressKey, progress);
  }, [progress, progressKey]);

  const activeIndex = lessons.findIndex((item) => item.id === activeLessonId);
  const lesson = lessons[activeIndex] ?? lessons[0];
  const lessonProgress = progress[lesson.id];
  const currentChapter = findChapterForLesson(chapters, lesson.id) ?? chapters[0];
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === currentChapter.id);
  const unlocked = isLessonUnlocked(activeIndex, progress, lessons);
  const answeredCount = lesson.questions.filter((question) => answers[question.id]).length;
  const currentCard = lesson.flashcards[cardIndex] ?? lesson.flashcards[0];
  const currentScore = lastScore ?? lessonProgress?.bestScore ?? 0;
  const submittedAnswers = Object.keys(lastSubmittedAnswers).length ? lastSubmittedAnswers : answers;
  const missedQuestions = useMemo(
    () => lesson.questions.filter((question) => submittedAnswers[question.id] !== question.answer),
    [lesson, submittedAnswers]
  );
  const reviewFlashcards = useMemo(
    () => relatedFlashcardsForMistakes(lesson, missedQuestions),
    [lesson, missedQuestions]
  );
  const nextLesson = lessons[activeIndex + 1] ?? null;
  const nextChapter = nextLesson ? findChapterForLesson(chapters, nextLesson.id) : null;
  const adaptiveState = useMemo(
    () => getAdaptiveState(progress, lesson, lessons, profile),
    [lesson, lessons, profile, progress]
  );
  const currentChapterComplete = currentChapter.lessons.every((item) => progress[item.id]?.passed);
  const activeQuizQuestion = useMemo(
    () =>
      lesson.questions.find((question) => question.id === activeSupportQuestionId) ??
      lesson.questions.find((question) => !answers[question.id]) ??
      lesson.questions[0],
    [activeSupportQuestionId, answers, lesson.questions]
  );
  const activeQuizQuestionIndex = activeQuizQuestion
    ? lesson.questions.findIndex((question) => question.id === activeQuizQuestion.id)
    : -1;

  useEffect(() => {
    if (phase !== "quiz" || !unlocked || !activeQuizQuestion) {
      return;
    }
    const timer = window.setTimeout(() => dispatchTutorNudge({
      id: `study:${lesson.id}:${activeQuizQuestion.id}:${answers[activeQuizQuestion.id] ? "answered" : "open"}`,
      title: `VAJA đang theo câu ${activeQuizQuestionIndex + 1}`,
      preview: answers[activeQuizQuestion.id]
        ? "Bạn đã chọn đáp án. VAJA có thể kiểm tra cách nghĩ."
        : "Mở VAJA nếu câu này chưa rõ.",
      actionLabel: `Gợi ý câu ${activeQuizQuestionIndex + 1}`,
      contextTopic: `study:${lesson.id}:question:${activeQuizQuestion.id}`,
      message: buildTutorQuestionPrompt(
        lesson,
        activeQuizQuestion,
        activeQuizQuestionIndex + 1,
        answers[activeQuizQuestion.id],
        adaptiveState
      )
    }), 0);
    return () => window.clearTimeout(timer);
  }, [activeQuizQuestion, activeQuizQuestionIndex, adaptiveState, answers, lesson, phase, unlocked]);

  if (loadingProfile) {
    return <LoadingPanel>Đang cá nhân hóa pathway học của bạn...</LoadingPanel>;
  }

  function selectLesson(nextLessonId: string) {
    const nextIndex = lessons.findIndex((item) => item.id === nextLessonId);
    if (!isLessonUnlocked(nextIndex, progress, lessons)) {
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
    setLastSubmittedAnswers({});
    setLastScore(null);
    setTutorInsight(null);
    setTutorInsightError(null);
    setLoadingTutorInsight(false);
    setActiveSupportQuestionId(null);
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
    setActiveSupportQuestionId(lesson.questions[0]?.id ?? null);
    setPhase("quiz");
  }

  function activateQuestionSupport(questionId: string) {
    setActiveSupportQuestionId(questionId);
  }

  function chooseQuizAnswer(questionId: string, option: string) {
    setAnswers((current) => ({ ...current, [questionId]: option }));
    const nextQuestion = lesson.questions.find((question) => question.id !== questionId && !answers[question.id]);
    setActiveSupportQuestionId(nextQuestion?.id ?? questionId);
  }

  function submitQuiz() {
    const correct = lesson.questions.filter((question) => answers[question.id] === question.answer).length;
    const score = Math.round((correct / lesson.questions.length) * 100);
    setLastScore(score);
    setLastSubmittedAnswers(answers);
    setTutorInsight(null);
    setTutorInsightError(null);
    if (accessToken) {
      void recordStudyQuizSignals(accessToken, lesson, answers);
    }
    setProgress((current) => {
      const previous = current[lesson.id];
      const recentScores = [...(previous?.recentScores ?? []), score].slice(-5);
      return {
        ...current,
        [lesson.id]: {
          bestScore: Math.max(previous?.bestScore ?? 0, score),
          passed: Boolean(previous?.passed || score >= passThreshold),
          attempts: (previous?.attempts ?? 0) + 1,
          failCount: score >= passThreshold ? previous?.failCount ?? 0 : (previous?.failCount ?? 0) + 1,
          lastScore: score,
          recentScores,
          completedAt: score >= passThreshold ? new Date().toISOString() : previous?.completedAt
        }
      };
    });
    setPhase("result");
  }

  function reviewMistakes() {
    setPhase("review");
    setCardIndex(0);
    setFlipped(false);
    setAnswers({});
    if (accessToken && missedQuestions.length) {
      void requestTutorMistakeHelp();
    }
  }

  async function requestTutorMistakeHelp() {
    if (!accessToken || loadingTutorInsight) {
      return;
    }
    setLoadingTutorInsight(true);
    setTutorInsightError(null);
    try {
      const response = await apiRequest<ChatResponse>("/chat", {
        method: "POST",
        token: accessToken,
        body: {
          message: buildTutorMistakePrompt(lesson, submittedAnswers, missedQuestions, currentScore, adaptiveState),
          contextTopic: `study:${lesson.id}`
        }
      });
      setTutorInsight({
        answer: response.answer,
        confidence: response.confidence,
        sessionId: response.sessionId,
        sources: response.sources
      });
    } catch (caught) {
      setTutorInsightError(caught instanceof ApiError ? caught.message : "VAJA chưa giải thích được lỗi sai lúc này");
    } finally {
      setLoadingTutorInsight(false);
    }
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
    setActiveLessonId(lessons[0].id);
    resetLessonState("learn");
  }

  return (
    <section className="study-path-page">
      <section className="study-path-hero">
        <div>
          <p className="eyebrow">Pathway học chính · {intro.label}</p>
          <h2>{intro.title}</h2>
          <p>
            {intro.description} Mỗi chương có 3 bài. Mỗi bài gồm học ngắn, thẻ nhớ và quiz cuối bài. Đạt từ {passThreshold}% trở lên thì bài kế tiếp mới mở.
          </p>
          <div className="study-profile-chips">
            <TopicChip>{displayLearningLevel(profile?.currentLevel)} → {displayLearningLevel(profile?.targetLevel, "N4")}</TopicChip>
            <TopicChip>Trọng tâm: {weakSkillSummary(profile)}</TopicChip>
            <TopicChip>{profile?.dailyStudyMinutes ?? 30} phút/ngày</TopicChip>
            <TopicChip>{adaptiveState.label}</TopicChip>
          </div>
        </div>
        <div className="study-path-score">
          <Trophy size={24} />
          <span>Tiến độ</span>
          <strong>{completedLessons(progress, lessons)}/{lessons.length}</strong>
          <small>{completedChapters(progress, chapters)}/{chapters.length} chương</small>
        </div>
      </section>

      <div className="study-path-layout">
        <Panel className="study-lesson-rail" eyebrow="Pathway" title="Đường học theo chương">
          <div className="study-lesson-list">
            {chapters.map((chapter, chapterIndex) => {
              const chapterDone = chapter.lessons.filter((item) => progress[item.id]?.passed).length;
              return (
                <div className="study-chapter-group" key={chapter.id}>
                  <div className={chapter.id === currentChapter.id ? "study-chapter-heading active" : "study-chapter-heading"}>
                    <span>Chương {chapterIndex + 1}</span>
                    <strong>{cleanChapterDisplay(chapter.title)}</strong>
                    <small>{chapterDone}/{chapter.lessons.length} bài · {chapter.focus}</small>
                  </div>
                  {chapter.lessons.map((item) => {
                    const itemIndex = lessons.findIndex((candidate) => candidate.id === item.id);
                    const itemUnlocked = isLessonUnlocked(itemIndex, progress, lessons);
                    const itemProgress = progress[item.id];
                    const itemStatus = lessonStatus(itemProgress, itemUnlocked, item.id === lesson.id);
                    return (
                      <button
                        className={item.id === lesson.id ? "study-lesson-row active" : "study-lesson-row"}
                        disabled={!itemUnlocked}
                        key={item.id}
                        type="button"
                        onClick={() => selectLesson(item.id)}
                      >
                        <span className="study-lesson-index">{itemProgress?.passed ? <CheckCircle2 size={16} /> : itemUnlocked ? itemIndex + 1 : <Lock size={15} />}</span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.level} · {item.focus}</small>
                        </span>
                        <em className={`study-lesson-status ${itemStatus.kind}`}>{itemStatus.label}</em>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          className="study-lesson-stage"
          eyebrow={`${currentChapter.title} · ${lesson.level} · ${lesson.focus}`}
          title={lesson.title}
          action={<LessonPhaseBadge phase={phase} />}
        >
          {!unlocked ? (
            <LockedLesson previous={lessons[activeIndex - 1]} />
          ) : (
            <>
              <div className="study-phase-track" aria-label="Luồng học trong bài">
                {lessonPhaseSteps.map((step) => (
                  <div className={`study-phase-node ${phaseStepState(step.phase, phase)}`} key={step.phase}>
                    <span>{step.label}</span>
                    <small>{step.hint}</small>
                  </div>
                ))}
              </div>

              {phase === "learn" && (
                <div className="study-learn-step">
                  <div className="study-pattern-card">
                    <TopicChip>{lessonPrimaryLabel(lesson)}</TopicChip>
                    <strong>{lesson.pattern}</strong>
                    <p>{lesson.summary}</p>
                  </div>
                  <div className="study-example-card">
                    <span>{lesson.example}</span>
                    <small>{lesson.translation}</small>
                  </div>
                  <div className="study-tutor-brief">
                    <Lightbulb size={20} />
                    <span>
                      Hôm nay tập trung vào {lesson.focus}. Nếu quiz sai, VAJA sẽ giữ bài này và đưa phần cần ôn ra trước.
                    </span>
                  </div>
                  <div className="study-action-row">
                    <PrimaryButton type="button" onClick={startFlashcards}>
                      <Layers3 size={18} />
                      Học thẻ của bài này
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {phase === "flashcards" && currentCard && (
                <div className="study-flashcard-step">
                  <div className="study-step-meter">
                    <TopicChip>Thẻ {cardIndex + 1}/{lesson.flashcards.length}</TopicChip>
                    <TopicChip>{flipped ? "Mặt sau" : "Mặt trước"}</TopicChip>
                    <TopicChip>{adaptiveState.label}</TopicChip>
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
                    <TopicChip>{adaptiveState.label}</TopicChip>
                  </div>
                  {lesson.questions.map((question, index) => (
                    <fieldset
                      className={activeQuizQuestion?.id === question.id ? "study-question active-support" : "study-question"}
                      key={question.id}
                      onFocus={() => activateQuestionSupport(question.id)}
                    >
                      <legend>{index + 1}. {question.prompt}</legend>
                      <div className="study-option-grid">
                        {question.options.map((option) => (
                          <button
                            className={answers[question.id] === option ? "study-option selected" : "study-option"}
                            key={option}
                            type="button"
                            onClick={() => chooseQuizAnswer(question.id, option)}
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

              {phase === "review" && (
                <div className="study-review-step">
                  <div className="study-step-meter">
                    <TopicChip>{missedQuestions.length || lesson.questions.length} câu cần ôn</TopicChip>
                    <TopicChip>{reviewFlashcards.length} thẻ gợi ý</TopicChip>
                    <TopicChip>{adaptiveState.label}</TopicChip>
                  </div>
                  <div className="study-mistake-plan">
                    <Target size={24} />
                    <div>
                      <strong>Ôn đúng phần vừa sai</strong>
                      <span>
                        VAJA giữ bạn ở bài này để vá phần chưa chắc trước. Khi làm lại đạt từ {passThreshold}%,
                        bài tiếp theo sẽ mở.
                      </span>
                    </div>
                  </div>
                  {accessToken && (
                    <TutorMistakeInsight
                      error={tutorInsightError}
                      insight={tutorInsight}
                      loading={loadingTutorInsight}
                      onRetry={requestTutorMistakeHelp}
                    />
                  )}
                  <div className="study-mistake-list">
                    {(missedQuestions.length ? missedQuestions : lesson.questions).map((question) => (
                      <article className="study-mistake-card" key={question.id}>
                        <strong>{question.prompt}</strong>
                        <span>Bạn chọn: {submittedAnswers[question.id] || "chưa chọn"}</span>
                        <span>Đáp án đúng: {question.answer}</span>
                        <small>{question.explanation}</small>
                      </article>
                    ))}
                  </div>
                  <div className="study-review-card-grid" aria-label="Thẻ nên ôn trước khi làm lại">
                    {reviewFlashcards.map((card) => (
                      <div className="study-review-flashcard" key={`${card.front}-${card.back}`}>
                        <strong>{card.front}</strong>
                        <span>{card.back}</span>
                        <small>{card.hint}</small>
                      </div>
                    ))}
                  </div>
                  <div className="study-action-row">
                    <PrimaryButton type="button" onClick={() => resetLessonState("quiz")}>
                      <ClipboardCheck size={18} />
                      Làm lại quiz
                    </PrimaryButton>
                    <IconTextButton type="button" variant="ghost" onClick={startFlashcards}>
                      <Layers3 size={18} />
                      Ôn toàn bộ thẻ
                    </IconTextButton>
                  </div>
                </div>
              )}

              {phase === "result" && (
                <div className={currentScore >= passThreshold ? "study-result passed" : "study-result retry"}>
                  <Trophy size={36} />
                  <h3>{currentScore >= passThreshold ? "Qua bài rồi." : "Chưa qua bài này."}</h3>
                  <strong>{currentScore}%</strong>
                  <p>{resultMessage(currentScore, nextLesson, nextChapter, currentChapter, adaptiveState)}</p>
                  {currentScore < passThreshold && (
                    <div className="study-mistake-plan compact">
                      <Target size={22} />
                      <div>
                        <strong>{missedQuestions.length} câu cần xem lại</strong>
                        <span>Ưu tiên ôn câu sai trước, sau đó làm lại quiz.</span>
                      </div>
                    </div>
                  )}
                  <div className="study-answer-review">
                    {lesson.questions.map((question) => {
                      const selected = submittedAnswers[question.id];
                      const correct = selected === question.answer;
                      return (
                        <div className={correct ? "study-answer-row correct" : "study-answer-row wrong"} key={question.id}>
                          {correct ? <CheckCircle2 size={16} /> : <CircleX size={16} />}
                          <span>{question.explanation}</span>
                        </div>
                      );
                    })}
                  </div>
                  {accessToken && (
                    <StudyFeedbackPrompt
                      token={accessToken}
                      feedbackKey={`study.${lesson.id}.${lessonProgress?.attempts ?? 0}.${currentScore}`}
                      mode="study"
                      title={currentChapterComplete ? "Chương này có hợp với bạn không?" : "Bài này có hợp với bạn không?"}
                      description="Trả lời nhanh để VAJA có dữ liệu cho user test và chỉnh pathway."
                      baseFeedback={{
                        moment: currentChapterComplete ? "CHAPTER" : "QUIZ",
                        contextType: currentChapterComplete ? "study_chapter" : "study_lesson",
                        contextId: currentChapterComplete ? currentChapter.id : lesson.id,
                        contextTitle: currentChapterComplete ? currentChapter.title : lesson.title
                      }}
                      defaultActionChoice={currentScore >= passThreshold ? "MOVE_ON" : "REVIEW_AGAIN"}
                      defaultPaceChoice={adaptiveState.pace.toUpperCase()}
                    />
                  )}
                  <div className="study-action-row">
                    {currentScore >= passThreshold && nextLesson ? (
                      <PrimaryButton type="button" onClick={goNextLesson}>
                        {nextChapter && nextChapter.id !== currentChapter.id ? "Sang chương tiếp theo" : "Học bài tiếp theo"}
                        <ArrowRight size={18} />
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton type="button" onClick={reviewMistakes}>
                        <RotateCcw size={18} />
                        Ôn câu sai trước
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

        <div className="study-side-stack">
          <Panel className="study-support-panel" eyebrow="Cá nhân hóa" title="Nhịp học hôm nay">
            <div className={`study-adaptive-card ${adaptiveState.pace}`}>
              <strong>{adaptiveState.label}</strong>
              <span>{adaptiveState.summary}</span>
              <small>{adaptiveState.target}</small>
            </div>
            <div className="study-adaptive-signals">
              <span>Chương hiện tại</span>
              <strong>{currentChapterIndex + 1}/{chapters.length}</strong>
              <span>Lần làm bài này</span>
              <strong>{lessonProgress?.attempts ?? 0}</strong>
              <span>Điểm tốt nhất</span>
              <strong>{lessonProgress?.bestScore ?? 0}%</strong>
            </div>
            <p className="muted-copy">{adaptiveState.detail}</p>
          </Panel>

          <Panel className="study-support-panel" eyebrow="Công cụ phụ" title="Khi bị kẹt">
            <button type="button" onClick={() => navigate("/learner/knowledge")}>
              <BookOpenCheck size={18} />
              Tra cứu khi bí
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
      </div>
    </section>
  );
}

function LessonPhaseBadge({ phase }: { phase: LessonPhase }) {
  const labels: Record<LessonPhase, string> = {
    learn: "Học",
    flashcards: "Thẻ nhớ",
    quiz: "Quiz",
    review: "Ôn sai",
    result: "Kết quả"
  };
  return <TopicChip>{labels[phase]}</TopicChip>;
}

function TutorMistakeInsight({
  error,
  insight,
  loading,
  onRetry
}: {
  error: string | null;
  insight: TutorInsight | null;
  loading: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="study-tutor-insight">
      <div className="study-tutor-insight-heading">
        <Bot size={22} />
        <div>
          <strong>VAJA Tutor xem lỗi sai của bạn</strong>
          <span>AI đọc câu sai, câu bạn chọn và đáp án đúng để giải thích theo bài này.</span>
        </div>
      </div>

      {loading && (
        <div className="study-tutor-loading">
          <Loader2 className="spin" size={18} />
          VAJA đang phân tích lỗi sai trong quiz...
        </div>
      )}

      {error && (
        <div className="study-tutor-error">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>Hỏi lại VAJA</button>
        </div>
      )}

      {insight && !loading && (
        <>
          <p>{insight.answer}</p>
          <div className="study-tutor-source-row">
            <TopicChip>Độ tin cậy {Math.round(insight.confidence * 100)}%</TopicChip>
            {insight.sources.slice(0, 3).map((source) => (
              <TopicChip key={`${source.type}-${source.id}`}>{source.title || source.id}</TopicChip>
            ))}
          </div>
          <button className="study-tutor-retry" type="button" onClick={onRetry}>
            Hỏi VAJA giải thích cách khác
          </button>
        </>
      )}
    </div>
  );
}

function lessonStatus(
  progress: LessonProgress | undefined,
  unlocked: boolean,
  active: boolean
): { kind: "current" | "review" | "done" | "locked" | "open"; label: string } {
  if (progress?.passed) {
    return { kind: "done", label: "Đã qua" };
  }
  if (!unlocked) {
    return { kind: "locked", label: "Khóa" };
  }
  if ((progress?.failCount ?? 0) > 0) {
    return { kind: "review", label: "Cần ôn" };
  }
  if (active) {
    return { kind: "current", label: "Đang học" };
  }
  return { kind: "open", label: `${progress?.bestScore ?? 0}%` };
}

function phaseStepState(stepPhase: Exclude<LessonPhase, "result">, currentPhase: LessonPhase): string {
  if (currentPhase === "result") {
    return stepPhase === "quiz" ? "active" : "done";
  }
  const currentIndex = lessonPhaseSteps.findIndex((step) => step.phase === currentPhase);
  const stepIndex = lessonPhaseSteps.findIndex((step) => step.phase === stepPhase);
  if (stepIndex < currentIndex) {
    return "done";
  }
  if (stepIndex === currentIndex) {
    return "active";
  }
  return "upcoming";
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

function resultMessage(
  score: number,
  nextLesson: StudyLesson | null,
  nextChapter: StudyChapter | null,
  currentChapter: StudyChapter,
  adaptiveState: AdaptiveState
): string {
  if (score < passThreshold) {
    return "VAJA sẽ giữ bạn ở bài này, giảm nhịp và ưu tiên ôn lại thẻ trước khi làm quiz lại.";
  }
  if (!nextLesson) {
    return "Bạn đã hoàn thành pathway hiện tại. VAJA sẽ chuyển trọng tâm sang ôn tập và đề tổng hợp.";
  }
  if (nextChapter && nextChapter.id !== currentChapter.id) {
    return `Chương kế tiếp đã mở. ${adaptiveState.pace === "fast" ? "Bạn đang học tốt nên có thể đi tiếp ngay." : "Bạn có thể nghỉ một chút rồi sang chương mới."}`;
  }
  return adaptiveState.pace === "fast"
    ? "Bạn qua rất chắc. VAJA tăng nhịp, có thể học thêm bài kế tiếp trong hôm nay."
    : "Bài kế tiếp đã mở. Cứ đi tiếp theo nhịp hiện tại.";
}

function buildTutorMistakePrompt(
  lesson: StudyLesson,
  submittedAnswers: Record<string, string>,
  missedQuestions: StudyQuestion[],
  score: number,
  adaptiveState: AdaptiveState
): string {
  const mistakes = missedQuestions.slice(0, 5).map((question, index) =>
    [
      `${index + 1}. Câu hỏi: ${question.prompt}`,
      `Người học chọn: ${submittedAnswers[question.id] || "chưa chọn"}`,
      `Đáp án đúng: ${question.answer}`,
      `Giải thích gốc: ${question.explanation}`
    ].join("\n")
  );

  return truncatePrompt(
    [
      `Người học vừa làm sai quiz trong bài "${lesson.title}" (${lesson.level}, trọng tâm ${lesson.focus}).`,
      `Điểm: ${score}%. Nhịp hiện tại: ${adaptiveState.label}.`,
      "Hãy đóng vai tutor trong bài học, giải thích bằng tiếng Việt dễ hiểu.",
      "Đừng chỉ đưa đáp án. Hãy nói vì sao người học sai, nên nhớ điểm nào, và cho 1 câu luyện rất ngắn.",
      "Các câu sai:",
      mistakes.join("\n\n"),
      "Kết thúc bằng một bước học tiếp theo trước khi làm lại quiz."
    ].join("\n")
  );
}

function dispatchTutorNudge(detail: TutorNudgeDetail) {
  window.dispatchEvent(new CustomEvent("vaja:tutor-nudge", { detail }));
}

function buildTutorQuestionPrompt(
  lesson: StudyLesson,
  question: StudyQuestion,
  questionNumber: number,
  selectedAnswer: string | undefined,
  adaptiveState: AdaptiveState
): string {
  return truncatePrompt(
    [
      `Mình đang làm câu ${questionNumber} trong bài "${lesson.title}" (${lesson.level}, trọng tâm ${lesson.focus}).`,
      `Câu hỏi: ${question.prompt}`,
      `Các lựa chọn: ${question.options.join(" | ")}`,
      selectedAnswer ? `Mình đang chọn: ${selectedAnswer}` : "Mình chưa chọn đáp án.",
      `Nhịp học hiện tại: ${adaptiveState.label}.`,
      "Hãy giải thích như tutor đang ngồi cạnh người mới học.",
      selectedAnswer
        ? "Hãy kiểm tra cách nghĩ của mình. Nếu đáp án này sai, nói vì sao sai và dẫn mình tới đáp án đúng."
        : "Đừng chốt đáp án ngay. Hãy gợi ý cách nhận ra từ khóa, mẫu câu, hoặc bẫy trong câu.",
      "Trả lời ngắn, bằng tiếng Việt dễ hiểu, kèm một ví dụ rất gần với bài."
    ].join("\n")
  );
}

async function recordStudyQuizSignals(
  token: string,
  lesson: StudyLesson,
  submittedAnswers: Record<string, string>
) {
  const knowledgeType = knowledgeTypeForLesson(lesson);
  await Promise.allSettled(
    lesson.questions.map((question) =>
      apiRequest("/personalization/me/progress/signals", {
        method: "POST",
        token,
        body: {
          knowledgeType,
          knowledgeId: `${lesson.id}:${question.id}`,
          title: truncateTitle(`${lesson.title}: ${question.prompt}`),
          level: lesson.level,
          source: "QUIZ",
          result: submittedAnswers[question.id] === question.answer ? "CORRECT" : "WRONG"
        }
      })
    )
  );
}

function knowledgeTypeForLesson(lesson: StudyLesson): string {
  const searchable = `${lesson.focus} ${lesson.title}`.toLowerCase();
  if (isKanaLesson(lesson)) {
    return "Kana";
  }
  if (searchable.includes("kanji") || searchable.includes("漢字")) {
    return "Kanji";
  }
  if (searchable.includes("từ") || searchable.includes("vocab") || searchable.includes("word")) {
    return "Vocabulary";
  }
  return "GrammarPoint";
}

function lessonPrimaryLabel(lesson: StudyLesson): string {
  return isKanaLesson(lesson) ? "Chữ cần nhớ" : "Mẫu chính";
}

function isKanaLesson(lesson: StudyLesson): boolean {
  const searchable = `${lesson.focus} ${lesson.title}`.toLowerCase();
  return (
    searchable.includes("kana") ||
    searchable.includes("hiragana") ||
    searchable.includes("katakana") ||
    searchable.includes("bảng chữ")
  );
}

function relatedFlashcardsForMistakes(lesson: StudyLesson, questions: StudyQuestion[]) {
  if (!questions.length) {
    return lesson.flashcards.slice(0, 3);
  }

  const questionText = normalizeStudyText(
    questions
      .flatMap((question) => [question.prompt, question.answer, question.explanation])
      .join(" ")
  );
  const matched = lesson.flashcards.filter((card) =>
    [card.front, card.back, card.hint].some((value) => {
      const normalized = normalizeStudyText(value);
      return normalized.length >= 2 && questionText.includes(normalized);
    })
  );

  return (matched.length ? matched : lesson.flashcards).slice(0, 3);
}

function normalizeStudyText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function truncateTitle(value: string): string {
  return value.length <= 190 ? value : `${value.slice(0, 187)}...`;
}

function truncatePrompt(value: string): string {
  return value.length <= 1900 ? value : `${value.slice(0, 1897)}...`;
}

function getAdaptiveState(
  progress: StudyProgress,
  lesson: StudyLesson,
  lessons: StudyLesson[],
  profile?: StudyProfile | null
): AdaptiveState {
  const lessonProgress = progress[lesson.id];
  const recentScores = lessons
    .map((item) => progress[item.id]?.lastScore)
    .filter((score): score is number => typeof score === "number")
    .slice(-3);
  const recentAverage = recentScores.length
    ? Math.round(recentScores.reduce((total, score) => total + score, 0) / recentScores.length)
    : 0;
  const currentFailCount = lessonProgress?.passed ? 0 : lessonProgress?.failCount ?? 0;
  const minutes = profile?.dailyStudyMinutes ?? 30;
  const strongCurrentScore = (lessonProgress?.lastScore ?? lessonProgress?.bestScore ?? 0) >= 95;
  const strongRecentScores = recentScores.length >= 2 && recentScores.every((score) => score >= 90);

  if (currentFailCount >= 2 || (!lessonProgress?.passed && (lessonProgress?.lastScore ?? 100) < 60)) {
    return {
      pace: "support",
      label: "Nhịp củng cố",
      summary: "Bạn đang rớt hoặc sai nhiều ở bài này, nên VAJA giữ nhịp chậm lại.",
      target: "Mục tiêu hôm nay: 1 bài, ôn thẻ kỹ rồi làm lại quiz.",
      detail: "Khi điểm ổn hơn, pathway tự mở bài tiếp theo. Nếu tiếp tục rớt, app vẫn giữ bạn ở chương hiện tại để tránh hổng nền."
    };
  }

  if (strongCurrentScore || strongRecentScores || (minutes >= 45 && recentAverage >= passThreshold)) {
    return {
      pace: "fast",
      label: "Nhịp nhanh",
      summary: "Bạn đang qua bài khá chắc, VAJA có thể đẩy nhanh tiến độ.",
      target: `Mục tiêu hôm nay: ${minutes >= 60 ? "2-3" : "2"} bài nếu vẫn giữ điểm từ ${passThreshold}%.`,
      detail: "Nếu điểm giảm, nhịp học sẽ tự quay về ổn định hoặc củng cố. Pathway không ép bạn chạy nhanh mãi."
    };
  }

  return {
    pace: "steady",
    label: "Nhịp ổn định",
    summary: "Bạn đang đi theo tốc độ bình thường của pathway.",
    target: `Mục tiêu hôm nay: ${minutes >= 45 ? "1-2" : "1"} bài, tùy thời gian học còn lại.`,
    detail: "VAJA theo dõi điểm quiz, số lần làm lại và thời gian học để tăng hoặc giảm nhịp ở các bài sau."
  };
}

function studyStorageKey(userId?: string, profile?: StudyProfile | null): string {
  const weakSkills = profile?.weakSkills?.slice().sort().join("-") || "none";
  const pathway = profile?.learningPathway ?? "jlpt_foundation";
  const currentLevel = profile?.currentLevel ?? "N5";
  const targetLevel = profile?.targetLevel ?? "N4";
  return `vaja.studyPathProgress.${userId ?? "anonymous"}.${pathway}.${currentLevel}.${targetLevel}.${weakSkills}`;
}

function readProgress(storageKey: string): StudyProgress {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StudyProgress) : {};
  } catch {
    localStorage.removeItem(storageKey);
    return {};
  }
}

function writeProgress(storageKey: string, progress: StudyProgress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function isLessonUnlocked(index: number, progress: StudyProgress, lessons: StudyLesson[]): boolean {
  if (index <= 0) {
    return true;
  }
  return Boolean(progress[lessons[index - 1]?.id]?.passed);
}

function firstUnlockedLesson(progress: StudyProgress, lessons: StudyLesson[]): StudyLesson {
  return (
    lessons.find((lesson, index) => isLessonUnlocked(index, progress, lessons) && !progress[lesson.id]?.passed) ??
    lessons[lessons.length - 1]
  );
}

function completedLessons(progress: StudyProgress, lessons: StudyLesson[]): number {
  return lessons.filter((lesson) => progress[lesson.id]?.passed).length;
}

function completedChapters(progress: StudyProgress, chapters: StudyChapter[]): number {
  return chapters.filter((chapter) => chapter.lessons.every((lesson) => progress[lesson.id]?.passed)).length;
}

function findChapterForLesson(chapters: StudyChapter[], lessonId: string): StudyChapter | null {
  return chapters.find((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId)) ?? null;
}

function cleanChapterDisplay(value: string): string {
  return value.replace(/^Chương\s+\d+:\s*/i, "");
}
