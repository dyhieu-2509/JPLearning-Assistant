import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "chrome");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        ...(browserChannel ? { channel: browserChannel } : {})
      }
    }
  ]
});
