import { defineConfig, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config";

/** A logic package (Part 19): opts into the 80% coverage gate the
 * root config deliberately leaves unset for apps/web. */
export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      coverage: {
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  }),
);
