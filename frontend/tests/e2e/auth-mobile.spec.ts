import { expect, test } from "@playwright/test";

const phoneViewports = [
  { name: "Galaxy Fold", width: 280, height: 653 },
  { name: "Small Android", width: 320, height: 568 },
  { name: "Galaxy S5", width: 360, height: 640 },
  { name: "Galaxy S8", width: 360, height: 740 },
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "Pixel 5", width: 393, height: 851 },
  { name: "Pixel 7", width: 412, height: 915 },
  { name: "iPhone Pro Max", width: 430, height: 932 },
  { name: "Small landscape", width: 568, height: 320 },
  { name: "iPhone SE landscape", width: 667, height: 375 },
  { name: "iPhone 12 landscape", width: 844, height: 390 }
];

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

for (const viewport of phoneViewports) {
  test(`Google login is usable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/login?mode=login");

    await expectNoHorizontalOverflow(page);
    await expect(page.locator(".auth-panel")).toBeVisible();

    const googleButton = page.getByRole("button", { name: /Google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeInViewport();

    const box = await googleButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}

test("Google login starts at the backend OAuth endpoint on local mobile dev", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login?mode=login");

  const oauthRequest = page.waitForRequest("http://localhost:8080/oauth2/authorization/google");
  await page.getByRole("button", { name: /Google/i }).click();

  expect((await oauthRequest).url()).toBe("http://localhost:8080/oauth2/authorization/google");
});

test("Google account-link callback is usable on the narrowest phone", async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 653 });
  await page.goto("/auth/callback?error=ACCOUNT_LINK_REQUIRED&email=learner@example.com&linkToken=test-link");

  await expectNoHorizontalOverflow(page);
  await expect(page.locator(".compact-auth .auth-panel")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
  await expect(page.getByRole("button", { name: /Google/i })).toBeInViewport();
});
