import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  // Run tests sequentially — the app uses client-side state that builds up per flow
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    // ── Setup project: connect endpoint once, save storage state ──────────────
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },
    // ── Main test project: uses saved storage state (fast, no re-introspection) ─
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/state.json",
      },
      dependencies: ["setup"],
      testIgnore: "**/auth.setup.ts",
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Reuse existing server when available (local dev); CI always starts fresh
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
