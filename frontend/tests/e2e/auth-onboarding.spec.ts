import { expect, type Page, type Route, test } from "@playwright/test";

const pendingDraft = {
  currentLevel: "ZERO",
  targetLevel: "N5",
  goal: "JLPT foundation N5 in 3 months",
  learningPathway: "jlpt_foundation",
  dailyStudyMinutes: 20,
  explanationStyle: "example-first",
  romajiEnabled: true,
  weakSkills: ["kana"]
};

const n5PendingDraft = {
  ...pendingDraft,
  currentLevel: "N5",
  targetLevel: "N4",
  weakSkills: ["grammar", "vocabulary"]
};

const existingProfile = {
  id: "profile-existing",
  currentLevel: "N4",
  targetLevel: "N4",
  avatarUrl: null,
  goal: "Japanese for work",
  learningPathway: "work",
  dailyStudyMinutes: 60,
  explanationStyle: "concise",
  romajiEnabled: false,
  weakSkills: ["kanji"]
};

const newProfile = {
  id: "profile-new",
  currentLevel: null,
  targetLevel: null,
  avatarUrl: null,
  goal: null,
  learningPathway: null,
  dailyStudyMinutes: 30,
  explanationStyle: null,
  romajiEnabled: true,
  weakSkills: []
};

test("login after pre-auth onboarding keeps the existing learning profile", async ({ page }) => {
  let profilePutCount = 0;
  await seedPendingOnboardingDraft(page, n5PendingDraft);
  await mockAuthApi(page, {
    activeProfile: existingProfile,
    onProfilePut: () => {
      profilePutCount += 1;
    }
  });

  await page.goto("/login?mode=register&onboarding=1");
  await expect(page.locator(".form-success")).toContainText("tài khoản mới");

  await page.locator(".segmented-control button").first().click();
  await expect(page.locator(".form-success")).toContainText("giữ lộ trình hiện tại");

  await page.locator("input[type='email']").fill("existing.learner@example.com");
  await page.locator("input[type='password']").fill("password123");
  await page.locator("button[type='submit']").click();

  await expect(page).toHaveURL(/\/learner$/);
  await expect(page.locator(".friendly-dashboard")).toBeVisible();
  expect(profilePutCount).toBe(0);

  const storage = await readAuthStorage(page);
  expect(storage.pendingDraft).toBeNull();
  expect(storage.oauthMode).toBeNull();
  expect(storage.authUserEmail).toBe("existing.learner@example.com");
});

test("zero beginner auth offers create account or optional guest trial only", async ({ page }) => {
  await seedPendingOnboardingDraft(page);

  await page.goto("/login?mode=register&onboarding=1");

  await expect(page.locator(".segmented-control.single")).toBeVisible();
  await expect(page.locator(".segmented-control button")).toHaveCount(1);
  await expect(page.locator(".segmented-control button")).toContainText("Tạo tài khoản mới");
  await expect(page.locator(".form-success")).toContainText("3 bài chữ cái");
  await expect(page.getByRole("button", { name: /Học thử 3 bài không đăng nhập/i })).toBeVisible();

  await page.getByRole("button", { name: /Học thử 3 bài không đăng nhập/i }).click();
  await expect(page).toHaveURL(/\/guest\/study$/);
  await expect(page.getByRole("heading", { name: /Pathway số 0/i })).toBeVisible();
});

test("register after pre-auth onboarding applies the saved draft to the new account", async ({ page }) => {
  const profileWrites: Array<Record<string, unknown>> = [];
  await seedPendingOnboardingDraft(page);
  await mockAuthApi(page, {
    activeProfile: newProfile,
    onProfilePut: (body) => {
      profileWrites.push(body);
    }
  });

  await page.goto("/login?mode=register&onboarding=1");
  await expect(page.locator(".form-success")).toContainText("tài khoản mới");

  await page.locator("input").first().fill("New Learner");
  await page.locator("input[type='email']").fill("new.learner@example.com");
  await page.locator("input[type='password']").fill("password123");
  await page.locator("button[type='submit']").click();

  await expect(page).toHaveURL(/\/learner$/);
  await expect(page.locator(".friendly-dashboard")).toBeVisible();
  expect(profileWrites).toHaveLength(1);
  expect(profileWrites[0]).toMatchObject(pendingDraft);

  const storage = await readAuthStorage(page);
  expect(storage.pendingDraft).toBeNull();
  expect(storage.authUserEmail).toBe("new.learner@example.com");
});

test("Google auth started from login mode does not mark the pending draft for sync", async ({ page }) => {
  await seedPendingOnboardingDraft(page, n5PendingDraft);
  await page.goto("/login?mode=login&onboarding=1");
  const appOrigin = new URL(page.url()).origin;

  const oauthRequest = page.waitForRequest("http://localhost:8080/oauth2/authorization/google");
  await page.getByRole("button", { name: /Google/i }).click();
  expect((await oauthRequest).url()).toBe("http://localhost:8080/oauth2/authorization/google");

  const storageState = await page.context().storageState();
  const oauthMode = storageState.origins
    .find((origin) => origin.origin === appOrigin)
    ?.localStorage.find((item) => item.name === "vaja.oauthOnboardingMode")?.value;
  expect(oauthMode).toBe("login");
});

async function seedPendingOnboardingDraft(page: Page, draft = pendingDraft) {
  await page.addInitScript((draft) => {
    window.localStorage.removeItem("vaja.auth");
    window.localStorage.removeItem("vaja.oauthOnboardingMode");
    window.localStorage.setItem("vaja.pendingOnboardingProfile", JSON.stringify(draft));
  }, draft);
}

async function readAuthStorage(page: Page) {
  return page.evaluate(() => {
    const rawAuth = window.localStorage.getItem("vaja.auth");
    const auth = rawAuth ? JSON.parse(rawAuth) : null;
    return {
      pendingDraft: window.localStorage.getItem("vaja.pendingOnboardingProfile"),
      oauthMode: window.localStorage.getItem("vaja.oauthOnboardingMode"),
      authUserEmail: auth?.user?.email ?? null
    };
  });
}

type MockAuthApiOptions = {
  activeProfile: Record<string, unknown>;
  onProfilePut?: (body: Record<string, unknown>) => void;
};

async function mockAuthApi(page: Page, options: MockAuthApiOptions) {
  let activeProfile = options.activeProfile;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (method === "POST" && path === "/auth/login") {
      const body = JSON.parse(request.postData() || "{}");
      await json(route, authResponse("user-existing", body.email ?? "existing.learner@example.com", "Existing Learner"));
      return;
    }

    if (method === "POST" && path === "/auth/register") {
      const body = JSON.parse(request.postData() || "{}");
      await json(route, authResponse("user-new", body.email ?? "new.learner@example.com", body.displayName ?? "New Learner"));
      return;
    }

    if (method === "GET" && path === "/personalization/me/profile") {
      await json(route, activeProfile);
      return;
    }

    if (method === "PUT" && path === "/personalization/me/profile") {
      const body = JSON.parse(request.postData() || "{}");
      options.onProfilePut?.(body);
      activeProfile = {
        ...activeProfile,
        ...body,
        updatedAt: "2026-08-10T08:00:00Z"
      };
      await json(route, activeProfile);
      return;
    }

    if (method === "GET" && path === "/personalization/me/dashboard") {
      await json(route, dashboardFor(activeProfile));
      return;
    }

    await route.fulfill({ status: 404, body: `Unhandled ${method} ${path}` });
  });
}

function authResponse(id: string, email: string, displayName: string) {
  return {
    accessToken: `${id}-access-token`,
    refreshToken: `${id}-refresh-token`,
    expiresIn: 480,
    user: {
      id,
      email,
      displayName,
      avatarUrl: null,
      role: "STUDENT",
      status: "ACTIVE"
    }
  };
}

function dashboardFor(profile: Record<string, unknown>) {
  return {
    profile,
    progress: {
      totalItems: 0,
      masteredItems: 0,
      weakItems: 0,
      averageMasteryScore: 0,
      weakestItems: []
    },
    flashcards: {
      totalCards: 0,
      dueCards: 0,
      dueNow: []
    },
    assessments: {
      completedSessions: 0,
      averageScorePercent: 0,
      latest: null,
      recentWeakAreas: []
    },
    chat: {
      sessionCount: 0,
      messageCount: 0,
      recentTopics: []
    },
    generatedAt: "2026-08-10T08:00:00Z"
  };
}

async function json(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body)
  });
}
