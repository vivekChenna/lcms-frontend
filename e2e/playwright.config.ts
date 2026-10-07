import { defineConfig, devices } from "@playwright/test";

/**
 * Assumes the backend is running on http://localhost:4000 against a FRESHLY SEEDED throwaway
 * database, e.g. (from lcms-backend):
 *
 *   createdb lcms_e2e   (or: docker exec <postgres> psql -U lcms -d postgres -c "CREATE DATABASE lcms_e2e")
 *   DATABASE_URL=postgres://lcms:lcms@localhost:5442/lcms_e2e pnpm migration:run
 *   DATABASE_URL=postgres://lcms:lcms@localhost:5442/lcms_e2e pnpm seed:demo
 *   DATABASE_URL=postgres://lcms:lcms@localhost:5442/lcms_e2e pnpm dev
 *
 * The frontend dev server is started by `webServer` below. Tests create their own data when
 * they mutate; the shared workflow data is ordered, so workers stay at 1.
 */
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  outputDir: "../test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    cwd: "..",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", testIgnore: /responsive\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "responsive-chromium",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "responsive-mobile-chrome",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    // No WebKit project: Playwright's WebKit build needs jxl.dll / libwebpdemux.dll, which are
    // missing on this Windows host. Add `{ name: "responsive-webkit", use: devices["Desktop Safari"] }`
    // on a machine that can run it (Linux CI, macOS).
  ],
});
