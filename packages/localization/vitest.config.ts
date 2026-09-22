import { defineConfig, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config";

/**
 * jsdom is needed only for LocaleContext.test.tsx (React state +
 * effects); the other tests here are plain functions.
 */
export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      environment: "jsdom",
    },
  }),
);
