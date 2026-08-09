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
  Mic,
  Play,
  RotateCcw,
  Square,
  Target,
  Trophy,
  Volume2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFormRequest, apiRequest, ApiError } from "../../../shared/api";
import { IconTextButton, LoadingPanel, Panel, PrimaryButton, TopicChip } from "../../../shared/components";
import { displayLearningLevel } from "../../../shared/levels";
import type { ChatResponse, PronunciationScoreResponse, StudentProfileResponse, StudyFeedbackRequest, StudyLessonAttemptResponse } from "../../../shared/models";
import { PilotSurveyPrompt } from "../feedback/PilotSurveyPrompt";
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
  type StudyPracticeTask,
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
  feedbackDifficultyFit?: string | null;
  feedbackActionChoice?: string | null;
  feedbackPaceChoice?: string | null;
  feedbackRating?: number | null;
  feedbackSupportCount?: number;
  feedbackFastCount?: number;
  feedbackUpdatedAt?: string;
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

const kanaOverviewRows = [
  {
    label: "Hiragana nguyên âm",
    cells: [
      { kana: "あ", romaji: "a", hint: "miệng mở" },
      { kana: "い", romaji: "i", hint: "âm ngắn" },
      { kana: "う", romaji: "u", hint: "môi khép nhẹ" },
      { kana: "え", romaji: "e", hint: "âm e" },
      { kana: "お", romaji: "o", hint: "âm o" }
    ]
  },
  {
    label: "Hiragana hay gặp",
    cells: [
      { kana: "か", romaji: "ka", hint: "hàng k" },
      { kana: "き", romaji: "ki", hint: "hàng k" },
      { kana: "さ", romaji: "sa", hint: "hàng s" },
      { kana: "し", romaji: "shi", hint: "không đọc si" },
      { kana: "た", romaji: "ta", hint: "hàng t" },
      { kana: "ち", romaji: "chi", hint: "không đọc ti" }
    ]
  },
  {
    label: "Katakana nguyên âm",
    cells: [
      { kana: "ア", romaji: "a", hint: "nét góc" },
      { kana: "イ", romaji: "i", hint: "nét góc" },
      { kana: "ウ", romaji: "u", hint: "nét góc" },
      { kana: "エ", romaji: "e", hint: "nét góc" },
      { kana: "オ", romaji: "o", hint: "nét góc" }
    ]
  }
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
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [flashcardAudioMessage, setFlashcardAudioMessage] = useState("");

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
    setActiveAttemptId(null);
    setFlashcardAudioMessage("");
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

  useEffect(() => {
    function handleTourStartLesson() {
      if (!unlocked) {
        return;
      }
      setPhase("flashcards");
      setCardIndex(0);
      setFlipped(false);
      setAnswers({});
      setLastSubmittedAnswers({});
      setLastScore(null);
      setTutorInsight(null);
      setTutorInsightError(null);
      setLoadingTutorInsight(false);
      setActiveSupportQuestionId(null);
      setActiveAttemptId(null);
      void startCurrentLessonAttempt();
      window.setTimeout(() => {
        document.querySelector(".study-flashcard")?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
    }

    window.addEventListener("vaja:start-study-lesson", handleTourStartLesson);
    return () => window.removeEventListener("vaja:start-study-lesson", handleTourStartLesson);
  }, [lesson.id, unlocked]);

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
    setActiveAttemptId(null);
    setFlashcardAudioMessage("");
  }

  function startFlashcards() {
    resetLessonState("flashcards");
    void startCurrentLessonAttempt();
  }

  function nextCard() {
    setFlipped(false);
    setFlashcardAudioMessage("");
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
      void completeCurrentLessonAttempt(score, correct);
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

  async function startCurrentLessonAttempt(): Promise<string | null> {
    if (!accessToken) {
      return null;
    }
    try {
      const response = await apiRequest<StudyLessonAttemptResponse>("/personalization/me/study-attempts", {
        method: "POST",
        token: accessToken,
        body: {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          level: lesson.level,
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title
        }
      });
      setActiveAttemptId(response.id);
      return response.id;
    } catch {
      return null;
    }
  }

  async function completeCurrentLessonAttempt(score: number, correct: number) {
    if (!accessToken) {
      return;
    }
    const attemptId = activeAttemptId ?? (await startCurrentLessonAttempt());
    if (!attemptId) {
      return;
    }
    try {
      await apiRequest<StudyLessonAttemptResponse>(`/personalization/me/study-attempts/${attemptId}/complete`, {
        method: "POST",
        token: accessToken,
        body: {
          scorePercent: score,
          correctCount: correct,
          totalQuestions: lesson.questions.length,
          passed: score >= passThreshold
        }
      });
    } catch {
      // Metrics collection should not interrupt the lesson flow.
    } finally {
      setActiveAttemptId(null);
    }
  }

  function applySubmittedFeedback(feedback: StudyFeedbackRequest) {
    setProgress((current) => applyFeedbackToProgress(current, lesson, currentScore, feedback));
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

  function retryQuiz() {
    resetLessonState("quiz");
    setActiveSupportQuestionId(lesson.questions[0]?.id ?? null);
    void startCurrentLessonAttempt();
  }

  function playCurrentCardAudio() {
    if (!currentCard) {
      return;
    }
    speakJapaneseText(currentCard.front, setFlashcardAudioMessage);
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
        <Panel className="study-lesson-rail" eyebrow="Pathway" title="Đường học theo chương" data-tour="study-roadmap">
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
                        <em className={`study-lesson-status ${itemStatus.kind}`} aria-label={itemStatus.label}>
                          {itemStatus.kind === "done" ? <CheckCircle2 size={16} /> : itemStatus.label}
                        </em>
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
          data-tour="study-stage"
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
                  {isKanaLesson(lesson) && <KanaOverview />}
                  <div className="study-pattern-card">
                    <TopicChip>{lessonPrimaryLabel(lesson)}</TopicChip>
                    <strong>{lesson.pattern}</strong>
                    <p>{lesson.summary}</p>
                  </div>
                  <div className="study-example-card">
                    <span>{lesson.example}</span>
                    <small>{lesson.translation}</small>
                  </div>
                  {lesson.practiceTasks?.length ? (
                    <div className="study-practice-grid" aria-label="Bài tập cá nhân theo pathway">
                      {lesson.practiceTasks.map((task) => (
                        <article className="study-practice-card" key={task.id}>
                          <TopicChip>{task.label}</TopicChip>
                          <strong>{task.title}</strong>
                          <p>{task.prompt}</p>
                          <small>{task.exampleAnswer}</small>
                          {isPronunciationPracticeTask(task) && (
                            <PronunciationPractice accessToken={accessToken} lesson={lesson} task={task} />
                          )}
                        </article>
                      ))}
                    </div>
                  ) : null}
                  <div className="study-tutor-brief">
                    <Lightbulb size={20} />
                    <span>
                      Hôm nay tập trung vào {lesson.focus}. Nếu quiz sai, VAJA sẽ giữ bài này và đưa phần cần ôn ra trước.
                    </span>
                  </div>
                  <div className="study-action-row" data-tour="study-next-action">
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
                  <div className="study-flashcard-toolbar">
                    <IconTextButton type="button" variant="ghost" onClick={playCurrentCardAudio}>
                      <Volume2 size={18} />
                      Nghe phát âm thẻ
                    </IconTextButton>
                    <small>{flashcardAudioMessage || "Nghe chữ, đọc lại một lần rồi mới qua thẻ tiếp theo."}</small>
                  </div>
                  <div className="study-action-row">
                    <IconTextButton type="button" variant="ghost" disabled={cardIndex === 0} onClick={() => {
                      setFlipped(false);
                      setCardIndex((current) => Math.max(0, current - 1));
                      setFlashcardAudioMessage("");
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
                      <small className="study-question-help">{questionHelperText(lesson)}</small>
                      {answers[question.id] && (
                        <div className={answers[question.id] === question.answer ? "study-question-explanation correct" : "study-question-explanation wrong"}>
                          {answers[question.id] === question.answer ? <CheckCircle2 size={17} /> : <CircleX size={17} />}
                          <span>
                            {answers[question.id] === question.answer
                              ? `Đúng. ${question.explanation}`
                              : `Chưa đúng. Đáp án: ${question.answer}. ${question.explanation}`}
                          </span>
                        </div>
                      )}
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
                    <PrimaryButton type="button" onClick={retryQuiz}>
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
                    <IconTextButton type="button" variant="ghost" onClick={retryQuiz}>
                      Làm lại quiz
                    </IconTextButton>
                  </div>
                  {accessToken && (
                    <>
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
                        onSubmitted={applySubmittedFeedback}
                      />
                      <PilotSurveyPrompt
                        token={accessToken}
                        surveyKey={`study.${lesson.id}.${lessonProgress?.attempts ?? 0}`}
                        baseSurvey={{
                          contextType: currentChapterComplete ? "study_chapter" : "study_lesson",
                          contextId: currentChapterComplete ? currentChapter.id : lesson.id,
                          contextTitle: currentChapterComplete ? currentChapter.title : lesson.title
                        }}
                      />
                    </>
                  )}
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

function KanaOverview() {
  return (
    <section className="kana-overview" aria-label="Bảng chữ cái tổng quan">
      <div className="kana-overview-heading">
        <div>
          <TopicChip>Bảng chữ cái</TopicChip>
          <strong>Nhìn tổng thể trước, rồi học từng thẻ.</strong>
        </div>
        <small>Người mới nên bấm nghe từng âm. Người đã học rồi có thể lướt nhanh.</small>
      </div>
      <div className="kana-overview-rows">
        {kanaOverviewRows.map((row) => (
          <div className="kana-overview-row" key={row.label}>
            <span>{row.label}</span>
            <div className="kana-overview-cells">
              {row.cells.map((cell) => (
                <button
                  aria-label={`Nghe ${cell.kana} đọc là ${cell.romaji}`}
                  className="kana-overview-cell"
                  key={`${row.label}-${cell.kana}`}
                  type="button"
                  onClick={() => speakJapaneseText(cell.kana)}
                >
                  <strong>{cell.kana}</strong>
                  <small>{cell.romaji}</small>
                  <em>{cell.hint}</em>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
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

function questionHelperText(lesson: StudyLesson): string {
  if (isKanaLesson(lesson)) {
    return "Gợi ý: đọc chữ trước, so với romaji hoặc hàng chữ trong bảng ở trên.";
  }
  return "Gợi ý: tìm mẫu chính trong câu, rồi loại đáp án dùng sai trợ từ hoặc sai nghĩa.";
}

function speakJapaneseText(text: string, onStatus?: (message: string) => void): boolean {
  const targetText = cleanPronunciationText(text);
  if (!targetText || !hasJapaneseText(targetText)) {
    onStatus?.("Thẻ này chưa có phần tiếng Nhật để phát âm.");
    return false;
  }
  if (typeof window === "undefined" || typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) {
    onStatus?.("Trình duyệt này chưa hỗ trợ phát âm mẫu.");
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(targetText);
  utterance.lang = "ja-JP";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  const japaneseVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("ja"));
  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }
  utterance.onend = () => onStatus?.("Đã phát âm mẫu. Đọc lại một lần trước khi qua thẻ tiếp.");
  utterance.onerror = () => onStatus?.("Không phát được mẫu trên trình duyệt này.");
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  onStatus?.("Đang phát âm mẫu tiếng Nhật...");
  return true;
}

function PronunciationPractice({
  accessToken,
  lesson,
  task
}: {
  accessToken: string | null;
  lesson: StudyLesson;
  task: StudyPracticeTask;
}) {
  const targetText = useMemo(() => pronunciationTargetText(lesson, task), [lesson, task]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<PronunciationScoreResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Nghe mẫu, ghi âm lại, rồi bấm AI chấm.");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream(mediaStreamRef.current);
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
    };
  }, []);

  function replaceRecording(nextBlob: Blob) {
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(nextBlob);
    recordingUrlRef.current = nextUrl;
    setRecordingUrl(nextUrl);
    setRecordingBlob(nextBlob);
    setScoreResult(null);
  }

  function playSample() {
    if (!targetText) {
      setMessage("Bài này chưa có câu mẫu để phát âm.");
      return;
    }
    if (typeof SpeechSynthesisUtterance === "undefined" || !("speechSynthesis" in window)) {
      setMessage("Trình duyệt này chưa hỗ trợ phát âm mẫu.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.86;
    utterance.pitch = 1;
    const japaneseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("ja"));
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }
    utterance.onend = () => setMessage("Đã phát mẫu. Ghi âm rồi nghe lại để so.");
    utterance.onerror = () => setMessage("Không phát được mẫu trên trình duyệt này.");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setMessage("Đang phát mẫu tiếng Nhật...");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("Trình duyệt này chưa hỗ trợ ghi âm.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        replaceRecording(blob);
        stopMediaStream(stream);
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
        setMessage("Đã ghi âm. Nghe lại rồi bấm AI chấm.");
      };
      recorder.start();
      setRecordingBlob(null);
      setScoreResult(null);
      setRecording(true);
      setMessage("Đang ghi âm. Đọc chậm và rõ.");
    } catch {
      setRecording(false);
      setMessage("Không mở được micro. Kiểm tra quyền micro của trình duyệt.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return;
    }
    recorder.stop();
    setMessage("Đang lưu bản ghi trên máy...");
  }

  async function scoreRecording() {
    if (!accessToken) {
      setMessage("Đăng nhập để AI chấm phát âm và lưu vào pathway.");
      return;
    }
    if (!recordingBlob) {
      setMessage("Ghi âm trước, rồi AI mới chấm được.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", recordingBlob, "pronunciation.webm");
    formData.append("targetText", targetText);
    formData.append("lessonId", lesson.id);
    formData.append("lessonTitle", lesson.title);
    formData.append("taskId", task.id);
    formData.append("taskTitle", task.title);
    formData.append("level", lesson.level);

    setScoring(true);
    setScoreResult(null);
    setMessage("AI đang nghe bản ghi và so với câu mẫu...");
    try {
      const response = await apiFormRequest<PronunciationScoreResponse>("/pronunciation/score", {
        method: "POST",
        token: accessToken,
        body: formData
      });
      setScoreResult(response);
      setMessage("Đã chấm phát âm và lưu vào pathway.");
    } catch (caught) {
      setMessage(caught instanceof ApiError ? caught.message : "AI chưa chấm được phát âm lúc này.");
    } finally {
      setScoring(false);
    }
  }

  async function savePronunciationSignal(result: "GOOD" | "AGAIN") {
    if (!accessToken) {
      setMessage("Đăng nhập để lưu kết quả phát âm vào pathway.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/personalization/me/progress/signals", {
        method: "POST",
        token: accessToken,
        body: {
          knowledgeType: "Pronunciation",
          knowledgeId: `${lesson.id}:${task.id}`,
          title: truncateTitle(`${lesson.title}: ${task.title}`),
          level: lesson.level,
          source: "EXPLICIT_FEEDBACK",
          result
        }
      });
      setMessage(result === "GOOD" ? "Đã lưu: phát âm ổn." : "Đã lưu: cần luyện phát âm lại.");
    } catch (caught) {
      setMessage(caught instanceof ApiError ? caught.message : "Chưa lưu được kết quả phát âm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pronunciation-practice" aria-label="Luyện phát âm">
      <div className="pronunciation-target">
        <Volume2 size={17} />
        <span>{targetText}</span>
      </div>
      <div className="pronunciation-action-row">
        <button type="button" onClick={playSample}>
          <Play size={16} />
          Nghe mẫu
        </button>
        {recording ? (
          <button type="button" onClick={stopRecording}>
            <Square size={16} />
            Dừng
          </button>
        ) : (
          <button type="button" onClick={startRecording}>
            <Mic size={16} />
            Ghi âm
          </button>
        )}
        <button type="button" disabled={!recordingBlob || scoring} onClick={scoreRecording}>
          {scoring ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
          AI chấm
        </button>
      </div>
      {recordingUrl && <audio className="pronunciation-audio" controls src={recordingUrl} />}
      {scoreResult && <PronunciationScoreResult result={scoreResult} />}
      <div className="pronunciation-score-row">
        <button type="button" disabled={saving || scoring} onClick={() => savePronunciationSignal("GOOD")}>
          Đọc được
        </button>
        <button type="button" disabled={saving || scoring} onClick={() => savePronunciationSignal("AGAIN")}>
          Chưa rõ
        </button>
      </div>
      <small className="pronunciation-status">{message}</small>
    </div>
  );
}

function PronunciationScoreResult({ result }: { result: PronunciationScoreResponse }) {
  const verdictLabel = pronunciationVerdictLabel(result.verdict);
  return (
    <div className={`pronunciation-result ${result.verdict.toLowerCase()}`}>
      <div className="pronunciation-result-heading">
        <strong>{result.scorePercent}%</strong>
        <span>{verdictLabel}</span>
        <small>Độ tin cậy {Math.round(result.confidence * 100)}%</small>
      </div>
      <p>{result.feedback}</p>
      {result.transcript && (
        <small>
          AI nghe được: <b>{result.transcript}</b>
        </small>
      )}
      {result.issues.length ? (
        <ul>
          {result.issues.slice(0, 3).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function pronunciationVerdictLabel(value: string): string {
  switch (value.toUpperCase()) {
    case "GOOD":
      return "Ổn";
    case "HARD":
      return "Gần đúng";
    default:
      return "Cần luyện lại";
  }
}

function isPronunciationPracticeTask(task: StudyPracticeTask): boolean {
  const searchable = `${task.id} ${task.label} ${task.title}`.toLowerCase();
  return [
    "conversation",
    "listening",
    "speaking",
    "kana",
    "school",
    "work",
    "giao",
    "nghe",
    "nói",
    "noi",
    "bảng",
    "bang"
  ].some((keyword) => searchable.includes(keyword));
}

function pronunciationTargetText(lesson: StudyLesson, task: StudyPracticeTask): string {
  const candidates = [
    lesson.example,
    task.exampleAnswer,
    lesson.pattern,
    ...lesson.flashcards.flatMap((card) => [card.front, card.hint])
  ];
  for (const candidate of candidates) {
    const fragment = extractJapaneseFragment(candidate);
    if (fragment) {
      return fragment;
    }
  }
  return lesson.example || task.exampleAnswer || lesson.pattern;
}

function extractJapaneseFragment(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const parts = value
    .split(/[\/|;；,，\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const fragment = parts.find((part) => hasJapaneseText(part)) ?? (hasJapaneseText(value) ? value.trim() : null);
  return fragment ? cleanPronunciationText(fragment) : null;
}

function cleanPronunciationText(value: string): string {
  return value
    .replace(/^[A-Za-zÀ-ỹ\s+]+(?=[\u3040-\u30ff\u3400-\u9fff])/u, "")
    .replace(/\s*(?:->|=>|→).*/u, "")
    .trim();
}

function hasJapaneseText(value: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
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

function applyFeedbackToProgress(
  progress: StudyProgress,
  lesson: StudyLesson,
  score: number,
  feedback: StudyFeedbackRequest
): StudyProgress {
  const previous = progress[lesson.id];
  const support = feedbackSuggestsSupport(feedback);
  const fast = feedbackSuggestsFast(feedback);
  return {
    ...progress,
    [lesson.id]: {
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      passed: Boolean(previous?.passed || score >= passThreshold),
      attempts: previous?.attempts ?? 0,
      failCount: previous?.failCount ?? 0,
      lastScore: previous?.lastScore ?? score,
      recentScores: previous?.recentScores,
      completedAt: previous?.completedAt,
      feedbackDifficultyFit: feedback.difficultyFit ?? null,
      feedbackActionChoice: feedback.actionChoice ?? null,
      feedbackPaceChoice: feedback.paceChoice ?? null,
      feedbackRating: feedback.rating ?? null,
      feedbackSupportCount: (previous?.feedbackSupportCount ?? 0) + (support ? 1 : 0),
      feedbackFastCount: (previous?.feedbackFastCount ?? 0) + (fast ? 1 : 0),
      feedbackUpdatedAt: new Date().toISOString()
    }
  };
}

function feedbackSuggestsSupport(feedback: StudyFeedbackRequest): boolean {
  const difficulty = feedback.difficultyFit?.toUpperCase();
  const action = feedback.actionChoice?.toUpperCase();
  return difficulty === "TOO_HARD" || action === "REVIEW_AGAIN" || (feedback.rating ?? 5) <= 2;
}

function feedbackSuggestsFast(feedback: StudyFeedbackRequest): boolean {
  const difficulty = feedback.difficultyFit?.toUpperCase();
  const action = feedback.actionChoice?.toUpperCase();
  return difficulty === "TOO_EASY" || (action === "MOVE_ON" && (feedback.rating ?? 0) >= 4);
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
    lesson.id.startsWith("kana-") ||
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
  const feedbackSupportCount = lessonProgress?.feedbackSupportCount ?? 0;
  const feedbackFastCount = lessonProgress?.feedbackFastCount ?? 0;

  if (feedbackSupportCount > 0 || currentFailCount >= 2 || (!lessonProgress?.passed && (lessonProgress?.lastScore ?? 100) < 60)) {
    return {
      pace: "support",
      label: "Nhịp củng cố",
      summary: feedbackSupportCount > 0
        ? "Bạn vừa báo bài này hơi khó hoặc muốn ôn lại, nên VAJA giữ nhịp chậm lại."
        : "Bạn đang rớt hoặc sai nhiều ở bài này, nên VAJA giữ nhịp chậm lại.",
      target: "Mục tiêu hôm nay: 1 bài, ôn thẻ kỹ rồi làm lại quiz.",
      detail: "Khi điểm ổn hơn, pathway tự mở bài tiếp theo. Nếu tiếp tục rớt, app vẫn giữ bạn ở chương hiện tại để tránh hổng nền."
    };
  }

  if ((feedbackFastCount > 0 && lessonProgress?.passed) || strongCurrentScore || strongRecentScores || (minutes >= 45 && recentAverage >= passThreshold)) {
    return {
      pace: "fast",
      label: "Nhịp nhanh",
      summary: feedbackFastCount > 0
        ? "Bạn vừa báo bài này dễ hoặc muốn đi tiếp, nên VAJA có thể đẩy nhanh tiến độ."
        : "Bạn đang qua bài khá chắc, VAJA có thể đẩy nhanh tiến độ.",
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
