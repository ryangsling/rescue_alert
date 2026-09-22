import { defineConfig } from "vitest/config";

/**
 * Workspace-root Vitest config. Individual packages may extend this
 * with their own vitest.config.ts (React Native Testing Library setup,
 * jsdom environment, etc.) as they gain real tests.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        "**/dist/**",
        "**/.next/**",
        "**/.expo/**",
        "**/coverage/**",
        "**/*.config.*",
        "**/supabase/**",
      ],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.expo/**"],
  },
});
