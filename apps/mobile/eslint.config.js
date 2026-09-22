// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // AGENTS.md project standard 11: no emojis in code or UI copy.
    rules: {
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
    ignores: ["dist/*"],
  },
]);
