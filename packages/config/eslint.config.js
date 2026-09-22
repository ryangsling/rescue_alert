// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint flat config for Rescue Alert workspaces.
 * Consumers spread this array and append project-specific rules.
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // No emoji anywhere in source - AGENTS.md project standard.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/u]",
          message: "No emojis in code, comments, or UI copy.",
        },
      ],
    },
  },
  {
    ignores: ["dist/**", ".next/**", ".expo/**", "coverage/**", "node_modules/**"],
  },
);
