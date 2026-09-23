// pnpm nests packages as node_modules/.pnpm/<name>@<version>/node_modules/<name>/,
// not the flat node_modules/<name>/ that most React Native
// transformIgnorePatterns examples assume - the pattern below allows
// an optional `.pnpm/<anything>/` segment before the package name so
// RN/Expo packages still get transformed regardless of which
// node_modules layer resolved them.
const RN_PACKAGES =
  "(jest-)?react-native|@react-native(-community)?/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|standard-navigation|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|lucide-react-native";

// See packages/ui/jest.config.cjs for why this redirect exists:
// jest-expo's resolver honours the "react-native" export condition,
// which points lucide-react-native at an untransformed .mjs build.
const esmEntry = require.resolve("lucide-react-native");
const cjsEntry = esmEntry.replace(
  "/dist/esm/lucide-react-native.mjs",
  "/dist/cjs/lucide-react-native.js",
);

module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${RN_PACKAGES}))`,
  ],
  moduleNameMapper: {
    "^lucide-react-native$": cjsEntry,
  },
};
