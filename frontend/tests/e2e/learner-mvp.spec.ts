import { expect, type Page, type Route, test } from "@playwright/test";

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

const savedPlan = {
  id: "plan-1",
  level: "N5",
  targetLevel: "N4",
  goal: "Thi JLPT N4 trong 3 tháng",
  weeklyStudyHours: 3,
  completedItems: 0,
  totalItems: 2,
  completionRate: 0,
  items: [
    {
      id: "item-1",
      order: 1,
      title: "Ôn trợ từ N5",
      objective: "Làm 5 câu về は và が.",
      estimatedHours: 1,
      completed: false,
      completedAt: null
    },
    {
      id: "item-2",
      order: 2,
      title: "Ôn từ vựng ăn uống",
      objective: "Ôn 10 thẻ N5 liên quan sinh hoạt.",
      estimatedHours: 1,
      completed: false,
      completedAt: null
    }
  ],
  createdAt: "2026-05-20T08:00:00Z",
  updatedAt: "2026-05-20T08:00:00Z"
};

test("learner can start a lesson, review flashcards, pass the quiz, and unlock the next lesson", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner");
  await page.getByRole("button", { name: /Học bài hôm nay/i }).click();

  await expect(page.getByRole("heading", { name: /Pathway JLPT/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bài 1: Giới thiệu bản thân/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();

  await walkThroughLessonOneFlashcards(page, true);
  await answerLessonOneCorrectly(page);
  await page.getByRole("button", { name: /Nộp quiz cuối bài/i }).click();

  await expect(page.getByRole("heading", { name: /Qua bài rồi/i })).toBeVisible();
  await expect(page.locator(".study-result > strong")).toHaveText("100%");
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeEnabled();

  await page.getByRole("button", { name: /Học bài tiếp theo/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 2: Đi đâu, làm gì/i })).toBeVisible();

  await page.getByRole("button", { name: /Làm lại pathway/i }).click();
  await expect(page.getByRole("heading", { name: /Bài 1: Giới thiệu bản thân/i })).toBeVisible();
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
  await expect(page.getByRole("button", { name: /Bài 2: Đi đâu, làm gì/i })).toBeDisabled();

  await page.getByRole("button", { name: /Ôn lại bài này/i }).click();
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

test("learner can open supporting tools from the guided study path", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Hỏi VAJA/i }).click();
  await expect(page.getByRole("heading", { name: /Hỏi khi bạn chưa hiểu/i })).toBeVisible();

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Tra mẫu câu đang học/i }).click();
  await expect(page.getByRole("heading", { name: /Tra cứu tiếng Nhật N5\/N4/i })).toBeVisible();

  await page.goto("/learner/study");
  await page.getByRole("button", { name: /Xem kho thẻ riêng/i }).click();
  await expect(page.getByRole("heading", { name: /Ôn thẻ theo trí nhớ thật/i })).toBeVisible();
});

const personalizedPathwayCases = [
  {
    name: "JLPT",
    profile: { learningPathway: "jlpt_foundation", weakSkills: ["grammar"], dailyStudyMinutes: 20 },
    heading: /Pathway JLPT/i,
    lesson: /Bài 1: Giới thiệu bản thân/i,
    focus: /Trọng tâm: ngữ pháp/i
  },
  {
    name: "conversation",
    profile: { learningPathway: "conversation", weakSkills: ["speaking"], dailyStudyMinutes: 10 },
    heading: /Pathway giao tiếp/i,
    lesson: /Bài 1: Chào hỏi hằng ngày/i,
    focus: /Trọng tâm: nói/i
  },
  {
    name: "school",
    profile: { learningPathway: "school", weakSkills: ["vocabulary"], dailyStudyMinutes: 30 },
    heading: /Pathway trên lớp/i,
    lesson: /Bài 1: Hỏi bài trên lớp/i,
    focus: /Trọng tâm: từ vựng/i
  },
  {
    name: "work",
    profile: { currentLevel: "N4", learningPathway: "work", weakSkills: ["listening"], dailyStudyMinutes: 60 },
    heading: /Pathway công việc/i,
    lesson: /Bài 1: Tự giới thiệu nơi làm việc/i,
    focus: /Trọng tâm: nghe/i
  },
  {
    name: "reading",
    profile: { learningPathway: "reading", weakSkills: ["kanji", "reading"], dailyStudyMinutes: 20 },
    heading: /Pathway đọc hiểu/i,
    lesson: /Bài 1: Đọc đoạn ngắn N5/i,
    focus: /Trọng tâm: kanji, đọc/i
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
  });
}

test("learner can understand the MVP study loop", async ({ page }) => {
  await seedAuthenticatedLearner(page);
  await mockMvpApi(page);

  await page.goto("/learner");
  await expect(page.getByRole("heading", { name: /hôm nay mình học nhẹ thôi/i })).toBeVisible();
  await expect(page.getByText("JLPT từng bước", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Học bài hôm nay/i })).toBeVisible();

  await page.getByRole("link", { name: /Kiểm tra/i }).click();
  await page.getByRole("button", { name: /Bắt đầu kiểm tra/i }).click();
  await expect(page.getByRole("heading", { name: /Chọn dạng đúng/i })).toBeVisible();
  await page.getByRole("radio", { name: "食べる" }).click();
  await page.getByRole("button", { name: /Nộp bài/i }).click();
  await expect(page.getByRole("heading", { name: /Đã xong lượt kiểm tra/i })).toBeVisible();

  await page.getByRole("link", { name: /Thẻ nhớ/i }).click();
  await expect(page.getByRole("heading", { name: /Ôn thẻ theo trí nhớ thật/i })).toBeVisible();
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
  await expect(page.getByRole("button", { name: "Hỏi VAJA", exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Lộ trình/i }).click();
  await page.getByRole("button", { name: /Xếp kế hoạch học/i }).click();
  await expect(page.getByText(/Ôn trợ từ N5/i)).toBeVisible();

  await page.getByRole("link", { name: /Hỏi bài/i }).click();
  await page.getByRole("button", { name: /Giải thích trợ từ は và が/i }).click();
  await expect(page.locator(".message-row.assistant .message-bubble").filter({ hasText: /は dùng để nêu chủ đề/i })).toBeVisible();
});

async function walkThroughLessonOneFlashcards(page: Page, includeBackButton = false) {
  await page.getByRole("button", { name: /Học thẻ của bài này/i }).click();

  if (includeBackButton) {
    await page.locator(".study-flashcard").click();
    await page.getByRole("button", { name: /Thẻ tiếp theo/i }).click();
    await expect(page.getByText("Thẻ 2/4", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Quay lại/i }).click();
    await expect(page.getByText("Thẻ 1/4", { exact: true })).toBeVisible();
  }

  for (let index = 0; index < 4; index += 1) {
    await page.locator(".study-flashcard").click();
    await page
      .getByRole("button", { name: index < 3 ? /Thẻ tiếp theo/i : /Làm quiz cuối bài/i })
      .click();
  }
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

async function seedAuthenticatedLearner(page: Page, userId = "user-1") {
  await page.addInitScript((seedUserId) => {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("vaja.studyPathProgress"))
      .forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(
      "vaja.auth",
      JSON.stringify({
        accessToken: "demo-token",
        refreshToken: "demo-refresh",
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
  }, userId);
}

async function mockMvpApi(page: Page, profileOverride: Partial<typeof profile> = {}) {
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
        }
      ]);
      return;
    }

    if (method === "GET" && path === "/flashcards/review/due") {
      await json(route, [card]);
      return;
    }

    if (method === "GET" && path === "/flashcards/decks/deck-1/cards") {
      await json(route, [card]);
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

    if (method === "GET" && path === "/planner/plans") {
      await json(route, [savedPlan]);
      return;
    }

    if (method === "POST" && path === "/planner/recommend") {
      await json(route, {
        planId: "plan-1",
        level: "N5",
        targetLevel: "N4",
        goal: "Thi JLPT N4 trong 3 tháng",
        weeklyStudyHours: 3,
        items: savedPlan.items.map(({ order, title, objective, estimatedHours }) => ({
          order,
          title,
          objective,
          estimatedHours
        })),
        context: {
          profile,
          weakProgress: dashboard.progress.weakestItems,
          dueFlashcards: [card],
          recentChatTopics: [],
          recentAssessment: dashboard.assessments.latest
        }
      });
      return;
    }

    if (method === "GET" && path === "/chat/sessions") {
      await json(route, []);
      return;
    }

    if (method === "GET" && path === "/chat/sessions/chat-1/messages") {
      await json(route, []);
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

async function json(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}
