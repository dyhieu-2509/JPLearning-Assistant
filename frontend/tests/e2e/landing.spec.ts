import { expect, test } from "@playwright/test";

test("landing lets learners choose how to start", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Học tiếng Nhật/i })).toBeVisible();

  await page.getByRole("button", { name: /Bắt đầu học/i }).click();

  await expect(page.getByRole("heading", { name: /Bạn muốn bắt đầu theo cách nào/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Người học mới/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Đang học tiếp/i })).toBeVisible();
});
