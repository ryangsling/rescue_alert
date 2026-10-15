import { defineConfig, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config";

/**
 * jsdom is needed only for LocaleContext.test.tsx (React state +
 * effects); the other tests here are plain functions. This is a
 * logic package (Part 19), so it opts into the 80% coverage gate the
 * root config deliberately leaves unset.
 */
export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      coverage: {
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  }),
);
