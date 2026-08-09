import { expect, type Page, type Route, test } from "@playwright/test";

test.setTimeout(60_000);

const profile = {
  id: "profile-1",
  userId: "user-1",
  currentLevel: "N5",
  targetLevel: "N4",
  avatarUrl: null,
  goal: "Thi JLPT N4 trong 3 tháng",
  learningPathway: "jlpt_foundation",
  dailyStudyMinutes: 20,
  explanationStyle: "step-by-step",
  romajiEnabled: true,
  weakSkills: ["vocabulary", "grammar"],
  createdAt: "2026-05-20T08:00:00Z",
  updatedAt: "2026-05-20T08:00:00Z"
};

const card = {
  id: "card-1",
  deckId: "deck-1",
  frontText: "食べる",
  backText: "ăn",
  reading: "たべる",
  sourceType: "Vocabulary",
  sourceId: "taberu:N5",
  level: "N5",
  easinessFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  nextReviewAt: "2026-05-20T08:00:00Z",
  lastReviewedAt: null
};

const kanjiCard = {
  id: "card-kanji-1",
  deckId: "deck-kanji",
  frontText: "日",
  backText: "ngày, mặt trời",
  reading: "にち / ひ",
  sourceType: "Kanji",
  sourceId: "kanji-hi:N5",
  level: "N5",
  easinessFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  nextReviewAt: "2026-05-20T08:00:00Z",
  lastReviewedAt: null
};

const n4Card = {
  id: "card-n4-1",
  deckId: "deck-n4",
  frontText: "便利",
  backText: "tiện lợi",
  reading: "べんり",
  sourceType: "Vocabulary",
  sourceId: "benri:N4",
  level: "N4",
  easinessFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  nextReviewAt: "2026-05-20T08:00:00Z",
  lastReviewedAt: null
};

const dashboard = {
  profile,
  progress: {
    totalItems: 2,
    masteredItems: 0,
    weakItems: 2,
    averageMasteryScore: 0.24,
    weakestItems: [
      {
        id: "progress-1",
        knowledgeType: "Vocabulary",
        knowledgeId: "taberu:N5",
        title: "食べる",
        level: "N5",
        masteryScore: 0.24,
        exposureCount: 1,
        correctCount: 0,
        wrongCount: 1,
        nextReviewAt: "2026-05-20T08:00:00Z",
        updatedAt: "2026-05-20T08:00:00Z"
      }
    ]
  },
  flashcards: {
    totalCards: 1,
    dueCards: 1,
    dueNow: [card]
  },
  assessments: {
    completedSessions: 1,
    averageScorePercent: 60,
    latest: {
      sessionId: "assessment-old",
      level: "N5",
      category: "grammar",
      score: 3,
      total: 5,
      weakAreas: ["particles"],
      submittedAt: "2026-05-20T08:00:00Z"
    },
    recentWeakAreas: ["particles"]
  },
  chat: {
    sessionCount: 0,
    messageCount: 0,
    recentTopics: []
  },
  generatedAt: "2026-05-20T08:00:00Z"
};

type MockMvpOptions = {
  onFeedback?: (feedback: Record<string, unknown>) => void;
  onLearningSignal?: (signal: Record<string, unknown>) => void;
  onLessonAttemptStart?: (attempt: Record<string, unknown>) => void;
  onLessonAttemptComplete?: (attempt: Record<string, unknown>) => void;
  onPilotSurvey?: (survey: Record<string, unknown>) => void;
  onPronunciationScore?: (formData: Record<string, string>) => void;
};

type SeedOptions = {
  tourSeen?: boolean;
};

test("learner can start a lesson, review flashcards, pass the quiz, and unlock the next lesson", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner");
  await page.getByRole("button", { name: /Học bài hôm nay/i }).click();

  await expect(page.getByRole("heading", { name: /Pathway JLPT/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bài 1: Giới thiệu bản thân/i })).toBeVisible();
  await expect(page.getByText(/Chương 1: Câu nền tảng N5/i)).toBeVisible();
  await expect(page.getByText(/Trợ từ và thời gian/i).first()).toBeVisible();
  await expect(page.getByText("Nhịp ổn định").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();

  await walkThroughLessonOneFlashcards(page, true);
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await expect(page.locator(".study-result > strong")).toHaveText("100%");
  await expect(page.getByText("Nhịp nhanh").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeEnabled();

  await page.getByRole("button", { name: /Học bài tiếp theo/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 2: Đi đâu, làm gì/i })).toBeVisible();

  await page.getByRole("button", { name: /Làm lại pathway/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 1: Giới thiệu bản thân/i })).toBeVisible();
  await expect(page.getByText(/Chương 1: Câu nền tảng N5/i)).toBeVisible();
  await expect(page.getByText(/Trợ từ và thời gian/i).first()).toBeVisible();
  await expect(page.getByText("Nhịp ổn định").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();
});

test("learner cannot unlock the next lesson below the pass score", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await walkThroughLessonOneFlashcards(page);
  await answerLessonOneIncorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  await expect(page.getByRole("heading", { name: /Chưa qua bài này/i })).toBeVisible();
  await expect(page.locator(".study-result > strong")).toHaveText("0%");
  await expect(page.getByText("Nhịp củng cố").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();

  await expect(page.getByText(/câu cần xem lại/i)).toBeVisible();
  await page.getByRole("button", { name: /Ôn câu sai trước/i }).click();
  await expect(page.getByText(/Ôn đúng phần vừa sai/i)).toBeVisible();
  await expect(page.getByText(/VAJA Tutor xem lỗi sai/i)).toBeVisible();
  await expect(
    page.locator(".study-tutor-insight").filter({ hasText: /は dùng để nêu chủ đề/i })
  ).toBeVisible();
  await expect(page.getByText(/Đáp án đúng/i).first()).toBeVisible();

  await page.getByRole("button", { name: /Ôn toàn bộ thẻ/i }).click();
  await expect(page.locator(".study-flashcard")).toBeVisible();

  for (let index = 0; index < 4; index += 1) {
    await page
      .getByRole("button", { name: index < 3 ? /Thẻ tiếp theo/i : /Làm quiz cuối bài/i })
      .click();
  }

  await answerLessonOneIncorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();

  await page.getByRole("button", { name: /Làm lại quiz/i }).click();
  await expect(page.getByRole("button", { name: /Nộp quiz cuối bài/i })).toBeDisabled();
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeEnabled();
});

test("study pilot feedback captures user-test signal after a lesson result", async ({ page }) => {
  const feedbackRequests: Array<Record<string, unknown>> = [];
  await seedAuthenticatedLearner(page, "pilot-feedback-user");
  await mockMvpApi(page, {}, { onFeedback: (feedback) => feedbackRequests.push(feedback) });

  await page.goto("/learner/study");
  await walkThroughLessonOneFlashcards(page);
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  const feedbackPanel = page.locator(".study-feedback");
  await expect(feedbackPanel).toBeVisible();
  await feedbackPanel.getByRole("button", { name: /Độ dễ hiểu 4/i }).click();
  await feedbackPanel.getByRole("button", { name: "Vừa sức", exact: true }).click();
  await feedbackPanel.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(feedbackPanel).toContainText(/Đã ghi nhận/i);
  await expect.poll(() => feedbackRequests.length).toBe(1);

  expect(feedbackRequests[0]).toMatchObject({
    moment: "QUIZ",
    contextType: "study_lesson",
    contextId: "n5-desu-wa",
    contextTitle: "Bài 1: Giới thiệu bản thân",
    rating: 4,
    difficultyFit: "JUST_RIGHT",
    actionChoice: "MOVE_ON",
    paceChoice: "FAST"
  });
});

test("study metrics records lesson attempt and SUS survey after quiz", async ({ page }) => {
  const attemptStarts: Array<Record<string, unknown>> = [];
  const attemptCompletions: Array<Record<string, unknown>> = [];
  const surveyRequests: Array<Record<string, unknown>> = [];
  await seedAuthenticatedLearner(page, "pilot-metrics-user");
  await mockMvpApi(page, {}, {
    onLessonAttemptStart: (attempt) => attemptStarts.push(attempt),
    onLessonAttemptComplete: (attempt) => attemptCompletions.push(attempt),
    onPilotSurvey: (survey) => surveyRequests.push(survey)
  });

  await page.goto("/learner/study");
  await walkThroughLessonOneFlashcards(page);
  await expect.poll(() => attemptStarts.length).toBe(1);
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  await expect.poll(() => attemptCompletions.length).toBe(1);
  expect(attemptStarts[0]).toMatchObject({
    lessonId: "n5-desu-wa",
    lessonTitle: "Bài 1: Giới thiệu bản thân",
    level: "N5",
    chapterId: "jlpt_foundation-entry"
  });
  expect(attemptCompletions[0]).toMatchObject({
    scorePercent: 100,
    correctCount: 5,
    totalQuestions: 5,
    passed: true
  });

  const survey = page.locator(".pilot-survey");
  await expect(survey).toBeVisible();
  await survey.getByRole("button", { name: "Mở khảo sát", exact: true }).click();
  const susScores = [5, 1, 4, 2, 5, 1, 4, 2, 5, 1];
  for (let index = 0; index < susScores.length; index += 1) {
    await survey
      .locator(".pilot-survey-question")
      .nth(index)
      .getByRole("button", { name: new RegExp(`${susScores[index]}$`) })
      .click();
  }
  await survey
    .locator(".pilot-survey-question")
    .last()
    .getByRole("button", { name: /Độ tin cậy vào VAJA Tutor 4$/ })
    .click();
  await survey.getByRole("textbox", { name: /Ghi chú ngắn/i }).fill("Path clear enough for a new learner");
  await survey.getByRole("button", { name: "Gửi khảo sát", exact: true }).click();

  await expect.poll(() => surveyRequests.length).toBe(1);
  expect(surveyRequests[0]).toMatchObject({
    contextType: "study_lesson",
    contextId: "n5-desu-wa",
    contextTitle: "Bài 1: Giới thiệu bản thân",
    susScores,
    trustRating: 4,
    comment: "Path clear enough for a new learner"
  });
});

test("study feedback changes the current adaptive pace", async ({ page }) => {
  await seedAuthenticatedLearner(page, "adaptive-feedback-user");
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await walkThroughLessonOneFlashcards(page);
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.locator(".study-adaptive-card.fast")).toContainText("Nhịp nhanh");

  const feedbackPanel = page.locator(".study-feedback");
  await feedbackPanel.getByRole("button", { name: /Độ dễ hiểu 2/i }).click();
  await feedbackPanel.getByRole("button", { name: "Hơi khó", exact: true }).click();
  await feedbackPanel.getByRole("button", { name: "Ôn lại", exact: true }).click();
  await feedbackPanel.getByRole("button", { name: "Gửi", exact: true }).click();

  await expect(page.locator(".study-adaptive-card.support")).toContainText("Nhịp củng cố");
  await expect(page.locator(".study-adaptive-card.support")).toContainText(/vừa báo bài này hơi khó/i);
});

test("learner can open supporting tools from the guided study path", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Mở hỏi VAJA/i }).click();
  await expect(page.getByRole("heading", { name: /Hỏi nhanh VAJA/i })).toBeVisible();
  await page.getByRole("button", { name: /Giải thích câu quiz sai/i }).click();
  await expect(
    page.locator(".floating-message-row.assistant .floating-message-bubble").filter({ hasText: /は dùng để nêu chủ đề/i })
  ).toBeVisible();

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Mở hỏi VAJA/i }).click();
  await page.getByRole("button", { name: /Tra cứu khi bí/i }).click();
  await expect(page.getByRole("heading", { name: /Từ điển Nhật - Việt N5\/N4/i })).toBeVisible();
  await expect(page.locator(".floating-tutor.open")).toHaveCount(0);

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Xem kho thẻ riêng/i }).click();
  await expect(page.getByRole("heading", { name: /Thẻ nhớ theo cấp học/i })).toBeVisible();
  await expect(page.locator(".floating-tutor.open")).toHaveCount(0);
});

test("quiz nudges the floating tutor for the current question", async ({ page }) => {
  await seedAuthenticatedLearner(page, "quiz-nudge-user");
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await walkThroughLessonOneFlashcards(page);

  const tutorButton = page.getByRole("button", { name: /có 1 gợi ý mới/i });
  await expect(tutorButton).toBeVisible();
  await expect(page.locator(".floating-tutor-badge")).toHaveText("1");

  await tutorButton.click();
  await expect(page.locator(".floating-nudge-card")).toContainText("VAJA đang theo câu 1");
  await page.getByRole("button", { name: /Gợi ý câu 1/i }).first().click();
  await expect(page.locator(".floating-message-row.user .floating-message-bubble")).toContainText(/Câu hỏi:/);
  await expect(
    page.locator(".floating-message-row.assistant .floating-message-bubble").filter({ hasText: /は dùng để nêu chủ đề/i })
  ).toBeVisible();

  await page.getByRole("button", { name: "わたしは学生です。", exact: true }).click();
  await expect(page.locator(".floating-nudge-card")).toContainText("VAJA đang theo câu 2");
});

test("zero beginner starts with kana before N5 grammar", async ({ page }) => {
  await seedAuthenticatedLearner(page, "zero-beginner-user");
  await mockMvpApi(page, {
    currentLevel: "ZERO",
    targetLevel: "N5",
    dailyStudyMinutes: 10,
    weakSkills: ["kana"]
  });

  await page.goto("/learner/study");
  await expect(page.getByRole("heading", { name: /Pathway số 0/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bài 1: Hiragana hàng あ/i })).toBeVisible();
  await expect(page.getByText(/Chương 1: Bảng chữ cái nhập môn/i)).toBeVisible();
  await expect(page.getByText(/Trọng tâm: bảng chữ/i)).toBeVisible();
  await expect(page.getByText(/Số 0 → N5/i)).toBeVisible();
  await expect(page.getByText("Chữ cần nhớ", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Hiragana hàng か-さ-た/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Bài 4: Giới thiệu bản thân/i })).toBeDisabled();

  await walkThroughCurrentLessonFlashcards(page, 5);
  await answerKanaLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Hiragana hàng か-さ-た/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Bài 4: Giới thiệu bản thân/i })).toBeDisabled();
});

test("zero beginner can finish the kana chapter before opening N5", async ({ page }) => {
  await seedAuthenticatedLearner(page, "zero-kana-chapter-user");
  await mockMvpApi(page, {
    currentLevel: "ZERO",
    targetLevel: "N5",
    dailyStudyMinutes: 10,
    weakSkills: ["kana"]
  });

  await page.goto("/learner/study");
  await expect(page.getByRole("heading", { name: /Bài 1: Hiragana hàng あ/i })).toBeVisible();

  await walkThroughCurrentLessonFlashcards(page, 5);
  await answerKanaLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await page.getByRole("button", { name: /Học bài tiếp theo/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 2: Hiragana hàng か-さ-た/i })).toBeVisible();

  await walkThroughCurrentLessonFlashcards(page, 6);
  await answerKanaLessonTwoCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await page.getByRole("button", { name: /Học bài tiếp theo/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 3: Katakana cơ bản/i })).toBeVisible();

  await walkThroughCurrentLessonFlashcards(page, 6);
  await answerKanaLessonThreeCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();
  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 4: Giới thiệu bản thân/i })).toBeEnabled();
  await page.getByRole("button", { name: /Sang chương tiếp theo/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 4: Giới thiệu bản thân/i })).toBeVisible();
});

test("conversation lessons include pronunciation sample, recording, AI score, and progress signal", async ({ page }) => {
  const pronunciationRequests: Record<string, string>[] = [];
  await mockBrowserRecording(page);
  await seedAuthenticatedLearner(page, "pronunciation-practice-user");
  await mockMvpApi(page, {
    learningPathway: "conversation",
    weakSkills: ["speaking"],
    dailyStudyMinutes: 10
  }, {
    onPronunciationScore: (request) => pronunciationRequests.push(request)
  });

  await page.goto("/learner/study");
  await expect(page.getByRole("heading", { name: /Pathway giao tiếp/i })).toBeVisible();
  await expect(page.locator(".pronunciation-practice").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Nghe mẫu/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Ghi âm/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /AI chấm/i }).first()).toBeDisabled();
  await expect(page.locator(".pronunciation-target").first()).toContainText(/[\u3040-\u30ff\u3400-\u9fff]/u);

  await page.getByRole("button", { name: /Ghi âm/i }).first().click();
  await page.getByRole("button", { name: /Dừng/i }).first().click();
  await expect(page.getByRole("button", { name: /AI chấm/i }).first()).toBeEnabled();
  await page.getByRole("button", { name: /AI chấm/i }).first().click();

  await expect.poll(() => pronunciationRequests.length).toBeGreaterThan(0);
  await expect(page.locator(".pronunciation-result").first()).toContainText("88%");
  await expect(page.locator(".pronunciation-result").first()).toContainText("はじめまして。");
  await expect(page.locator(".pronunciation-result").first()).toContainText(/Bạn đọc rõ/i);
  expect(pronunciationRequests[0].raw).toContain("targetText");
});

const personalizedPathwayCases = [
  {
    name: "zero beginner",
    profile: { currentLevel: "ZERO", targetLevel: "N5", weakSkills: ["kana"], dailyStudyMinutes: 10 },
    heading: /Pathway số 0/i,
    lesson: /Bài 1: Hiragana hàng あ/i,
    focus: /Trọng tâm: bảng chữ/i,
    practice: /Che romaji, đọc kana/i
  },
  {
    name: "JLPT",
    profile: { learningPathway: "jlpt_foundation", weakSkills: ["grammar"], dailyStudyMinutes: 20 },
    heading: /Pathway JLPT/i,
    lesson: /Bài 1: Giới thiệu bản thân/i,
    focus: /Trọng tâm: ngữ pháp/i,
    practice: /Tách mẫu và ý nghĩa/i
  },
  {
    name: "conversation",
    profile: { learningPathway: "conversation", weakSkills: ["speaking"], dailyStudyMinutes: 10 },
    heading: /Pathway giao tiếp/i,
    lesson: /Bài 1: Chào hỏi hằng ngày/i,
    focus: /Trọng tâm: nói/i,
    practice: /Đóng vai hội thoại 2 lượt/i
  },
  {
    name: "school",
    profile: { learningPathway: "school", weakSkills: ["vocabulary"], dailyStudyMinutes: 30 },
    heading: /Pathway trên lớp/i,
    lesson: /Bài 1: Hỏi bài trên lớp/i,
    focus: /Trọng tâm: từ vựng/i,
    practice: /Hỏi lại phần chưa rõ/i
  },
  {
    name: "work",
    profile: { currentLevel: "N4", learningPathway: "work", weakSkills: ["listening"], dailyStudyMinutes: 60 },
    heading: /Pathway công việc/i,
    lesson: /Bài 1: Tự giới thiệu nơi làm việc/i,
    focus: /Trọng tâm: nghe/i,
    practice: /Đổi sang câu lịch sự/i
  },
  {
    name: "reading",
    profile: { learningPathway: "reading", weakSkills: ["kanji", "reading"], dailyStudyMinutes: 20 },
    heading: /Pathway đọc hiểu/i,
    lesson: /Bài 1: Đọc đoạn ngắn N5/i,
    focus: /Trọng tâm: kanji, đọc/i,
    practice: /Tìm từ khóa trong câu/i
  },
  {
    name: "N5 kana review without zero reset",
    profile: { currentLevel: "N5", learningPathway: "conversation", weakSkills: ["kana", "speaking"], dailyStudyMinutes: 25 },
    heading: /Pathway giao tiếp/i,
    lesson: /Bài 1: Chào hỏi hằng ngày/i,
    focus: /Trọng tâm: bảng chữ, nói/i,
    practice: /Che romaji, đọc kana/i
  }
];

for (const scenario of personalizedPathwayCases) {
  test(`guided study path is personalized for ${scenario.name}`, async ({ page }) => {
    await seedAuthenticatedLearner(page, `user-${scenario.name}`);
    await mockMvpApi(page, scenario.profile);

    await page.goto("/learner/study");
    await expect(page.getByRole("heading", { name: scenario.heading })).toBeVisible();
    await expect(page.getByRole("heading", { name: scenario.lesson })).toBeVisible();
    await expect(page.getByText(scenario.focus)).toBeVisible();
    await expect(page.getByText(scenario.practice)).toBeVisible();
  });
}

test("same JLPT pathway changes early support lessons by weak skill", async ({ page }) => {
  await seedAuthenticatedLearner(page, "jlpt-grammar-support-user");
  await mockMvpApi(page, {
    learningPathway: "jlpt_foundation",
    weakSkills: ["grammar"],
    dailyStudyMinutes: 20
  });

  await page.goto("/learner/study");
  await expect(page.getByRole("heading", { name: /Pathway JLPT/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bài 1: Giới thiệu bản thân/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Làm ở đâu, vào lúc nào/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Bài 3: Thời gian và tần suất/i })).toBeDisabled();
  await expect(page.getByText(/Tách mẫu và ý nghĩa/i)).toBeVisible();
});

test("learner can understand the MVP study loop", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner");
  await expect(page.getByRole("heading", { name: /hôm nay mình học nhẹ thôi/i })).toBeVisible();
  await expect(page.getByText("JLPT từng bước", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Học bài hôm nay/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lộ trình/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Hỏi bài/i })).toHaveCount(0);

  await page.getByRole("link", { name: /Kiểm tra/i }).click();
  await page.getByRole("button", { name: /Bắt đầu kiểm tra/i }).click();
  await expect(page.getByRole("heading", { name: /Chọn dạng đúng/i })).toBeVisible();
  await page.getByRole("radio", { name: "食べる" }).click();
  await page.getByRole("button", { name: /Nộp bài/i }).click();
  await expect(page.getByRole("heading", { name: /Đã xong lượt kiểm tra/i })).toBeVisible();

  await page.getByRole("link", { name: /Thẻ nhớ/i }).click();
  await expect(page.getByRole("heading", { name: /Thẻ nhớ theo cấp học/i })).toBeVisible();
  await page.getByRole("button", { name: "Kanji", exact: true }).click();
  await expect(page.getByRole("button", { name: /N5 kanji/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /N5 vocabulary/i })).toHaveCount(0);
  await expect(page.locator(".flashcard-study-panel").getByText(kanjiCard.frontText, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Từ vựng", exact: true }).click();
  await expect(page.getByRole("button", { name: /N5 vocabulary/i })).toBeVisible();
  await page.getByRole("button", { name: "Câu sai", exact: true }).click();
  await expect(page.locator(".flashcard-study-panel").getByText(card.frontText, { exact: true })).toBeVisible();
  const studyPanel = page.locator(".flashcard-study-panel");
  await page.getByRole("button", { name: "Lật đáp án", exact: true }).click();
  await expect(studyPanel.getByText(card.backText, { exact: true })).toBeVisible();
  await page.locator(".flashcard-card").click();
  await expect(studyPanel.getByText(card.frontText, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lật đáp án", exact: true }).click();
  await page.getByRole("button", { name: /Nhớ được/i }).click();
  await expect(page.getByText(/Nhớ được đã được lưu/i)).toBeVisible();

  await page.getByRole("link", { name: /Tra cứu/i }).click();
  await page.getByRole("button", { name: "食べる" }).click();
  await expect(page.getByRole("heading", { name: "食べる", exact: true })).toBeVisible();
  await expect(page.getByText("Dùng khi nào?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hỏi VAJA", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: /Mở hỏi VAJA/i }).click();
  await page.getByRole("button", { name: /Giải thích dễ hiểu bằng tiếng Việt/i }).click();
  await expect(
    page.locator(".floating-message-row.assistant .floating-message-bubble").filter({ hasText: /は dùng để nêu chủ đề/i })
  ).toBeVisible();
});

test("new learner can follow the guided app tour", async ({ page }) => {
  const userId = "guided-tour-user";
  await seedAuthenticatedLearner(page, userId, { tourSeen: false });
  await mockMvpApi(page);

  await page.goto("/learner");

  const tour = page.locator(".learner-tour-card");
  await expect(tour).toContainText("Bắt đầu ở đây", { timeout: 15000 });
  await expect(page.locator(".learner-tour-highlight")).toBeVisible();
  await expect(page.locator('[data-tour="today-start"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Một buổi học có 3 bước");
  await expect(page.locator('[data-tour="daily-loop"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Tab Học là luồng chính");
  await expect(page.locator('[data-tour="nav-study"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(page).toHaveURL(/\/learner\/study$/);
  await expect(tour).toContainText("Khung giữa là bài hôm nay");
  await expect(page.locator('[data-tour="study-stage"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Pathway mở dần theo chương");
  await expect(page.locator('[data-tour="study-roadmap"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Bí thì hỏi VAJA");
  await expect(page.locator('[data-tour="floating-tutor"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Thẻ nhớ để ôn thêm");
  await expect(page.locator('[data-tour="nav-flashcards"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Tra cứu khi gặp từ lạ");
  await expect(page.locator('[data-tour="nav-lookup"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Tiếp", exact: true }).click();
  await expect(tour).toContainText("Bây giờ vào học");
  await expect(page.locator('[data-tour="study-next-action"]')).toHaveClass(/tour-target-active/);

  await tour.getByRole("button", { name: "Bắt đầu học", exact: true }).click();
  await expect(tour).toHaveCount(0);
  await expect(page.locator(".study-flashcard")).toBeVisible();
  await expect(page.getByText("Thẻ 1/4", { exact: true })).toBeVisible();
  await expect.poll(async () =>
    page.evaluate((currentUserId) => window.localStorage.getItem(`vaja.learnerTour.seen.v1.${currentUserId}`), userId)
  ).toBe("true");

  await page.getByRole("button", { name: /Giới thiệu nhanh/i }).click();
  await expect(page.locator(".learner-tour-card")).toContainText("Bắt đầu ở đây");
});

test("learner session refreshes access token after a 401", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "vaja.auth",
      JSON.stringify({
        accessToken: "expired-access",
        refreshToken: "refresh-1",
        expiresAt: Date.now() + 5 * 60_000,
        user: {
          id: "refresh-user",
          email: "refresh.learner@example.com",
          displayName: "Refresh Learner",
          avatarUrl: null,
          role: "STUDENT",
          status: "ACTIVE"
        }
      })
    );
  });

  let refreshCalls = 0;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();
    const authHeader = request.headers().authorization;

    if (method === "POST" && path === "/auth/refresh") {
      refreshCalls += 1;
      await json(route, {
        accessToken: "fresh-access",
        refreshToken: "refresh-2",
        expiresIn: 480,
        user: {
          id: "refresh-user",
          email: "refresh.learner@example.com",
          displayName: "Refresh Learner",
          avatarUrl: null,
          role: "STUDENT",
          status: "ACTIVE"
        }
      });
      return;
    }

    if (authHeader !== "Bearer fresh-access") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "expired" })
      });
      return;
    }

    if (method === "GET" && path === "/personalization/me/profile") {
      await json(route, { ...profile, userId: "refresh-user" });
      return;
    }

    if (method === "GET" && path === "/personalization/me/dashboard") {
      await json(route, {
        ...dashboard,
        profile: { ...profile, userId: "refresh-user" }
      });
      return;
    }

    await route.fulfill({ status: 404, body: `Unhandled ${method} ${path}` });
  });

  await page.goto("/learner");
  await expect(page.locator(".friendly-dashboard")).toBeVisible({ timeout: 15000 });
  await expect.poll(() => refreshCalls).toBe(1);

  const storedAuth = await page.evaluate(() => JSON.parse(window.localStorage.getItem("vaja.auth") || "{}"));
  expect(storedAuth.accessToken).toBe("fresh-access");
  expect(storedAuth.refreshToken).toBe("refresh-2");
});

test("new learner can finish onboarding and reach the dashboard", async ({ page }) => {
  await seedAuthenticatedLearner(page, "new-onboarding-user");
  await mockOnboardingApi(page);

  await page.goto("/learner");
  await expect(page.locator(".onboarding-panel")).toBeVisible({ timeout: 15000 });

  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".choice-grid button").nth(3).click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".choice-grid button").nth(0).click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".choice-grid button").nth(3).click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".choice-grid button").nth(3).click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".onboarding-actions button").last().click();
  await page.locator(".choice-grid button").nth(1).click();
  await page.locator(".onboarding-actions button").last().click();

  await expect(page).toHaveURL(/\/learner$/);
  await expect(page.locator(".friendly-dashboard")).toBeVisible();
});

test("mobile study view shows the active lesson before the full pathway", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuthenticatedLearner(page, "mobile-study-user");
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await expect(page.locator(".study-lesson-stage")).toBeVisible({ timeout: 15000 });

  const stageBox = await page.locator(".study-lesson-stage").boundingBox();
  const railBox = await page.locator(".study-lesson-rail").boundingBox();
  expect(stageBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(railBox?.y ?? 0);
});

async function walkThroughLessonOneFlashcards(page: Page, includeBackButton = false) {
  await walkThroughCurrentLessonFlashcards(page, 4, includeBackButton);
}

async function walkThroughCurrentLessonFlashcards(page: Page, cardCount: number, includeBackButton = false) {
  await page.getByRole("button", { name: /Học thẻ của bài này/i }).click();

  if (includeBackButton) {
    await page.locator(".study-flashcard").click();
    await page.getByRole("button", { name: /Thẻ tiếp theo/i }).click();
    await expect(page.getByText(`Thẻ 2/${cardCount}`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Quay lại/i }).click();
    await expect(page.getByText(`Thẻ 1/${cardCount}`, { exact: true })).toBeVisible();
  }

  for (let index = 0; index < cardCount; index += 1) {
    await page.locator(".study-flashcard").click();
    await page
      .getByRole("button", { name: index < cardCount - 1 ? /Thẻ tiếp theo/i : /Làm quiz cuối bài/i })
      .click();
  }
}

async function answerKanaLessonOneCorrectly(page: Page) {
  await page.locator(".study-question").nth(0).getByRole("button", { name: "a", exact: true }).click();
  await page.locator(".study-question").nth(1).getByRole("button", { name: "i", exact: true }).click();
  await page.locator(".study-question").nth(2).getByRole("button", { name: "あ い う え お", exact: true }).click();
  await page.locator(".study-question").nth(3).getByRole("button", { name: "e", exact: true }).click();
  await page.locator(".study-question").nth(4).getByRole("button", { name: "o", exact: true }).click();
}

async function answerKanaLessonTwoCorrectly(page: Page) {
  await page.locator(".study-question").nth(0).getByRole("button", { name: "ka", exact: true }).click();
  await page.locator(".study-question").nth(1).getByRole("button", { name: "shi", exact: true }).click();
  await page.locator(".study-question").nth(2).getByRole("button", { name: "ta", exact: true }).click();
  await page.locator(".study-question").nth(3).getByRole("button", { name: "su + shi", exact: true }).click();
  await page.locator(".study-question").nth(4).getByRole("button", { name: "chi", exact: true }).click();
}

async function answerKanaLessonThreeCorrectly(page: Page) {
  await page.locator(".study-question").nth(0).getByRole("button", { name: "a", exact: true }).click();
  await page.locator(".study-question").nth(1).getByRole("button", { name: "ア イ ウ エ オ", exact: true }).click();
  await page.locator(".study-question").nth(2).getByRole("button", { name: "cà phê", exact: true }).click();
  await page.locator(".study-question").nth(3).getByRole("button", { name: "bài kiểm tra", exact: true }).click();
  await page.locator(".study-question").nth(4).getByRole("button", { name: "từ mượn và tên riêng", exact: true }).click();
}

async function mockBrowserRecording(page: Page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      readonly mimeType = "audio/webm";
      state: RecordingState = "inactive";

      constructor(_stream: MediaStream) {}

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["voice"], { type: "audio/webm" }) } as BlobEvent);
        this.onstop?.();
      }
    }

    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined }]
        })
      }
    });
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: FakeMediaRecorder
    });
  });
}

async function answerLessonOneCorrectly(page: Page) {
  await page.getByRole("button", { name: "わたしは学生です。", exact: true }).click();
  await page.getByRole("button", { name: "Đánh dấu chủ đề", exact: true }).click();
  await page.getByRole("button", { name: "Cuối câu", exact: true }).click();
  await page.getByRole("button", { name: "がくせい", exact: true }).click();
  await page.getByRole("button", { name: "Tôi là sinh viên", exact: true }).click();
}

async function answerLessonOneIncorrectly(page: Page) {
  await page.getByRole("button", { name: "わたしを学生です。", exact: true }).click();
  await page.getByRole("button", { name: "Đánh dấu tân ngữ", exact: true }).click();
  await page.getByRole("button", { name: "Đầu câu", exact: true }).click();
  await page.getByRole("button", { name: "せんせい", exact: true }).click();
  await page.getByRole("button", { name: "Tôi ăn cơm", exact: true }).click();
}

async function seedAuthenticatedLearner(page: Page, userId = "user-1", options: SeedOptions = {}) {
  await page.addInitScript(({ seedUserId, tourSeen }) => {
    Object.keys(window.localStorage)
      .filter((key) =>
        key.startsWith("vaja.studyPathProgress") ||
        key.startsWith("vaja.studyFeedback") ||
        key.startsWith("vaja.pilotSurvey") ||
        key.startsWith("vaja.learnerTour.seen")
      )
      .forEach((key) => window.localStorage.removeItem(key));
    if (tourSeen) {
      window.localStorage.setItem(`vaja.learnerTour.seen.v1.${seedUserId}`, "true");
    }
    window.localStorage.setItem(
      "vaja.auth",
      JSON.stringify({
        accessToken: "demo-token",
        refreshToken: "demo-refresh",
        expiresAt: Date.now() + 5 * 60_000,
        user: {
          id: seedUserId,
          email: "demo.learner@example.com",
          displayName: "Demo Learner",
          avatarUrl: null,
          role: "STUDENT",
          status: "ACTIVE"
        }
      })
    );
  }, { seedUserId: userId, tourSeen: options.tourSeen ?? true });
}

async function mockMvpApi(page: Page, profileOverride: Partial<typeof profile> = {}, options: MockMvpOptions = {}) {
  const activeProfile = { ...profile, ...profileOverride };
  const activeDashboard = { ...dashboard, profile: activeProfile };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (method === "GET" && path === "/personalization/me/profile") {
      await json(route, activeProfile);
      return;
    }

    if (method === "GET" && path === "/personalization/me/dashboard") {
      await json(route, activeDashboard);
      return;
    }

    if (method === "GET" && path === "/personalization/me/progress") {
      await json(route, activeDashboard.progress.weakestItems);
      return;
    }

    if (method === "POST" && path === "/personalization/me/feedback") {
      const feedback = JSON.parse(request.postData() || "{}");
      options.onFeedback?.(feedback);
      await json(route, {
        id: "feedback-1",
        userId: activeProfile.userId,
        createdAt: "2026-05-20T08:00:00Z",
        ...feedback
      });
      return;
    }

    if (method === "POST" && path === "/personalization/me/study-attempts") {
      const attempt = JSON.parse(request.postData() || "{}");
      options.onLessonAttemptStart?.(attempt);
      await json(route, {
        id: "attempt-1",
        userId: activeProfile.userId,
        status: "STARTED",
        startedAt: "2026-05-20T08:00:00Z",
        updatedAt: "2026-05-20T08:00:00Z",
        ...attempt
      });
      return;
    }

    if (method === "POST" && path === "/personalization/me/study-attempts/attempt-1/complete") {
      const attempt = JSON.parse(request.postData() || "{}");
      options.onLessonAttemptComplete?.(attempt);
      await json(route, {
        id: "attempt-1",
        userId: activeProfile.userId,
        lessonId: "n5-desu-wa",
        lessonTitle: "Bài 1: Giới thiệu bản thân",
        level: "N5",
        chapterId: "jlpt_foundation-entry",
        chapterTitle: "Chương 1: Câu nền tảng N5",
        status: "COMPLETED",
        durationSeconds: 420,
        startedAt: "2026-05-20T08:00:00Z",
        submittedAt: "2026-05-20T08:07:00Z",
        updatedAt: "2026-05-20T08:07:00Z",
        ...attempt
      });
      return;
    }

    if (method === "POST" && path === "/personalization/me/pilot-surveys") {
      const survey = JSON.parse(request.postData() || "{}");
      options.onPilotSurvey?.(survey);
      await json(route, {
        id: "survey-1",
        userId: activeProfile.userId,
        susScore: 90,
        createdAt: "2026-05-20T08:08:00Z",
        ...survey
      });
      return;
    }

    if (method === "POST" && path === "/personalization/me/progress/signals") {
      const signal = JSON.parse(request.postData() || "{}");
      options.onLearningSignal?.(signal);
      await json(route, {
        id: `progress-${signal.knowledgeId ?? "study"}`,
        userId: activeProfile.userId,
        knowledgeType: signal.knowledgeType,
        knowledgeId: signal.knowledgeId,
        title: signal.title,
        level: signal.level,
        masteryScore: signal.result === "CORRECT" ? 0.58 : 0.18,
        exposureCount: 0,
        correctCount: signal.result === "CORRECT" ? 1 : 0,
        wrongCount: signal.result === "WRONG" ? 1 : 0,
        nextReviewAt: "2026-05-21T08:00:00Z",
        updatedAt: "2026-05-20T08:00:00Z"
      });
      return;
    }

    if (method === "POST" && path === "/pronunciation/score") {
      options.onPronunciationScore?.({ raw: request.postData() || "" });
      await json(route, {
        transcript: "はじめまして。",
        scorePercent: 88,
        verdict: "GOOD",
        feedback: "Bạn đọc rõ. Giữ nhịp này.",
        issues: ["Âm cuối nghe ổn"],
        confidence: 0.86,
        progress: {
          id: "progress-pronunciation",
          userId: activeProfile.userId,
          knowledgeType: "Pronunciation",
          knowledgeId: "conversation-greetings:conversation-greetings-practice",
          title: "Chào hỏi: Đóng vai hội thoại",
          level: "N5",
          masteryScore: 0.44,
          exposureCount: 0,
          correctCount: 1,
          wrongCount: 0,
          nextReviewAt: "2026-05-21T08:00:00Z",
          updatedAt: "2026-05-20T08:00:00Z"
        }
      });
      return;
    }

    if (method === "GET" && path.startsWith("/knowledge/")) {
      await json(route, [
        {
          type: "Vocabulary",
          id: "taberu:N5",
          title: "食べる",
          reading: "たべる",
          meaningVi: "ăn",
          meaningEn: "eat",
          level: "N5",
          source: "JLPT N5"
        }
      ]);
      return;
    }

    if (method === "POST" && path === "/assessment/sessions") {
      await json(route, {
        sessionId: "assessment-1",
        level: "N5",
        category: "vocabulary",
        questions: [
          {
            id: "q1",
            prompt: "Chọn dạng đúng của 食べます.",
            options: ["食べる", "食べた", "食べて"]
          }
        ]
      });
      return;
    }

    if (method === "POST" && path === "/assessment/sessions/assessment-1/submit") {
      await json(route, {
        sessionId: "assessment-1",
        score: 1,
        total: 1,
        weakAreas: [],
        results: [
          {
            questionId: "q1",
            selectedAnswer: "食べる",
            correctAnswer: "食べる",
            correct: true,
            explanation: "食べます là thể lịch sự, dạng từ điển là 食べる."
          }
        ],
        progress: []
      });
      return;
    }

    if (method === "GET" && path === "/flashcards/decks") {
      await json(route, [
        {
          id: "deck-1",
          title: "N5 vocabulary",
          level: "N5",
          category: "vocabulary",
          cardCount: 1,
          createdAt: "2026-05-20T08:00:00Z",
          updatedAt: "2026-05-20T08:00:00Z"
        },
        {
          id: "deck-kanji",
          title: "N5 kanji",
          level: "N5",
          category: "kanji",
          cardCount: 1,
          createdAt: "2026-05-20T08:00:00Z",
          updatedAt: "2026-05-20T08:00:00Z"
        },
        {
          id: "deck-n4",
          title: "N4 vocabulary",
          level: "N4",
          category: "vocabulary",
          cardCount: 1,
          createdAt: "2026-05-20T08:00:00Z",
          updatedAt: "2026-05-20T08:00:00Z"
        }
      ]);
      return;
    }

    if (method === "GET" && path === "/flashcards/review/due") {
      await json(route, [card, kanjiCard, n4Card]);
      return;
    }

    if (method === "GET" && path === "/flashcards/decks/deck-1/cards") {
      await json(route, [card]);
      return;
    }

    if (method === "GET" && path === "/flashcards/decks/deck-kanji/cards") {
      await json(route, [kanjiCard]);
      return;
    }

    if (method === "GET" && path === "/flashcards/decks/deck-n4/cards") {
      await json(route, [n4Card]);
      return;
    }

    if (method === "POST" && path === "/flashcards/review") {
      await json(route, {
        card: { ...card, repetitions: 1, intervalDays: 1, nextReviewAt: "2026-05-21T08:00:00Z" },
        progress: {
          id: "progress-1",
          knowledgeType: "Vocabulary",
          knowledgeId: "taberu:N5",
          title: "食べる",
          level: "N5",
          masteryScore: 0.32,
          exposureCount: 1,
          correctCount: 1,
          wrongCount: 0,
          nextReviewAt: "2026-05-21T08:00:00Z",
          updatedAt: "2026-05-20T08:00:00Z"
        },
        masteryScore: 0.32
      });
      return;
    }

    if (method === "POST" && path === "/chat") {
      await json(route, {
        answer: "は dùng để nêu chủ đề, が thường nhấn mạnh chủ ngữ hoặc thông tin mới.",
        sources: [{ type: "GrammarPoint", id: "particle-wa-ga:N5", title: "は vs が" }],
        confidence: 0.82,
        sessionId: "chat-1"
      });
      return;
    }

    await route.fulfill({ status: 404, body: `Unhandled ${method} ${path}` });
  });
}

async function mockOnboardingApi(page: Page) {
  const defaultProfile = {
    ...profile,
    goal: "JLPT preparation",
    learningPathway: "jlpt_foundation",
    dailyStudyMinutes: 30,
    explanationStyle: "concise",
    romajiEnabled: true,
    weakSkills: []
  };
  let savedProfile: typeof profile | null = null;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (method === "GET" && path === "/personalization/me/profile") {
      await json(route, savedProfile ?? defaultProfile);
      return;
    }

    if (method === "PUT" && path === "/personalization/me/profile") {
      const body = JSON.parse(request.postData() || "{}");
      savedProfile = {
        ...defaultProfile,
        ...body,
        updatedAt: "2026-05-20T08:10:00Z"
      };
      await json(route, savedProfile);
      return;
    }

    if (method === "GET" && path === "/personalization/me/dashboard") {
      await json(route, {
        ...dashboard,
        profile: savedProfile ?? defaultProfile
      });
      return;
    }

    await route.fulfill({ status: 404, body: `Unhandled ${method} ${path}` });
  });
}

async function json(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}
