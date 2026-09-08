import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 360_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--headless=new", "--disable-extensions"],
    },
    ...devices["Desktop Chrome"],
  },
  globalSetup: "./e2e/global-setup.ts",
  projects: [
    {
      name: "cockpit-dry",
      grep: /@dry/,
    },
    {
      name: "cockpit-live",
      grep: /@live/,
    },
    {
      name: "sales-funnel-dry",
      grep: /@sales-dry/,
    },
    {
      name: "sales-funnel-live",
      grep: /@sales-live/,
    },
    {
      name: "client-dashboard-dry",
      grep: /@dashboard-dry/,
    },
    {
      name: "client-dashboard-live",
      grep: /@dashboard-live/,
    },
    {
      name: "internal-ops",
      grep: /@internal-ops/,
    },
    {
      name: "journey",
      grep: /@journey/,
    },
    {
      name: "visual",
      grep: /@visual/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.CI
          ? undefined
          : {
              executablePath:
                process.env.PLAYWRIGHT_CHROME_PATH ||
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              args: ["--headless=new", "--disable-extensions"],
            },
      },
    },
  ],
});
