import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const dbPath = "e2e/.data/e2e.db";

export default defineConfig({
  testDir: "e2e",
  // Tests share one app server and database
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Requires a production build (npm run build); uses its own fresh database
    command: `node scripts/create-test-db.mjs ${dbPath} && npx next start -p ${port}`,
    url: `http://localhost:${port}/auth/signin`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: `file:${process.cwd()}/${dbPath}`,
      AUTH_SECRET: "e2e-test-secret-e2e-test-secret-e2e-test",
      AUTH_TRUST_HOST: "true",
    },
  },
});
