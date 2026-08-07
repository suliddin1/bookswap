import { defineConfig, devices } from "@playwright/test";

const workers = process.env.CI ? 1 : 4;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers,
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-webkit",
      testMatch: /(listing-authoring-mobile|messaging-mobile)\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
