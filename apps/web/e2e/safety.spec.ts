import { test, expect } from "@playwright/test";

/** Purely static - no Supabase call at all, so this is the one page
 * that can never be blocked by "no seeded live data". */
test("the safety page states the no-guarantee disclaimer and bite/rabies guidance", async ({
  page,
}) => {
  await page.goto("/safety");
  await expect(
    page.getByRole("heading", { name: "Safety information" }),
  ).toBeVisible();
  await expect(
    page.getByText(/does not guarantee that any rescue will be attempted/i),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /bitten or scratched/i }),
  ).toBeVisible();
});
