import { test, expect } from "@playwright/test";

/**
 * These hit the real Supabase project (anon, read-only queries) since
 * no local Supabase stack is available in this environment - they
 * prove the pages render and the anon-safe RPCs resolve, not that any
 * particular case/organization exists (no seeded data exists in the
 * live project yet, the same disclosed limitation as every other
 * part this session).
 */

test("the public directory page renders without error", async ({ page }) => {
  const response = await page.goto("/directory");
  expect(response?.status()).toBe(200);
});

test("the public open-cases listing renders without error", async ({
  page,
}) => {
  const response = await page.goto("/share/open-cases");
  expect(response?.status()).toBe(200);
});

test("the public rescue-history listing renders without error", async ({
  page,
}) => {
  const response = await page.goto("/share/rescues");
  expect(response?.status()).toBe(200);
});

test("a case that does not exist returns a real 404, not a silent blank page", async ({
  page,
}) => {
  const response = await page.goto("/share/case/RA-DOESNOTEXIST");
  expect(response?.status()).toBe(404);
});

test("sign-in page renders the email/password form", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel(/email/i).first()).toBeVisible();
});
