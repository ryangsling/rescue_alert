import { defineConfig } from "vitest/config";

/**
 * Workspace-root Vitest config. Individual packages may extend this
 * with their own vitest.config.ts (React Native Testing Library setup,
 * jsdom environment, etc.) as they gain real tests.
 *
 * Deliberately no coverage.thresholds here: this config is shared by
 * logic packages (api, validation, localization, drafts) and apps/web,
 * and an 80% statement-coverage gate makes sense for the former but
 * not the latter - apps/web's real correctness signal is Playwright
 * E2E (Part 19), not unit statement coverage on 1000+ line page
 * components. Each logic package that wants the gate sets its own
 * `coverage.thresholds` in its own vitest.config.ts (see
 * packages/localization's for the pattern) rather than inheriting one
 * silently from here.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "**/dist/**",
        "**/.next/**",
        "**/.expo/**",
        "**/coverage/**",
        "**/*.config.*",
        "**/supabase/**",
        // Plain re-export barrels carry no logic of their own to cover.
        "**/src/index.ts",
        "**/e2e/**",
      ],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.expo/**",
      // Playwright specs (apps/web/e2e) use Playwright's own `test`/
      // `expect`, not Vitest's - Vitest's default *.spec.ts pattern
      // would otherwise try to run them and fail immediately.
      "**/e2e/**",
    ],
  },
});
