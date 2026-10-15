import { defineConfig } from "@playwright/test";

/**
 * Part 19: web E2E. Scoped to the public, anon-reachable pages only
 * (directory, safety, share/*) - the authenticated flows (report,
 * respond, moderate) need a seeded test account on the live project,
 * which does not exist yet (same disclosed limitation as every
 * manual-device item in docs/PLAN.md). Runs against a real `next
 * start` production server, not `next dev`, so it exercises the same
 * build CI already produces.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
