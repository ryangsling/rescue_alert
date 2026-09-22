// See apps/mobile/jest.config.js for why the .pnpm segment matters.
const RN_PACKAGES =
  "(jest-)?react-native|@react-native(-community)?/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|lucide-react-native";

// require.resolve("lucide-react-native") goes through the package's
// own "exports" map, which - under jest-expo's react-native export
// condition - resolves to its ESM (.mjs) build. A deep subpath
// specifier like "lucide-react-native/dist/cjs/..." is blocked by
// that same exports map (only "." and a few subpaths are exported).
// Resolving once to get an absolute path, then substituting the
// known esm->cjs path segment, sidesteps the exports map entirely -
// requiring an absolute path never consults it.
const esmEntry = require.resolve("lucide-react-native");
const cjsEntry = esmEntry.replace(
  "/dist/esm/lucide-react-native.mjs",
  "/dist/cjs/lucide-react-native.js",
);

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${RN_PACKAGES}))`,
  ],
  // jest-expo's resolver deliberately mimics Metro and honours the
  // package's "react-native" export condition, which points lucide-
  // react-native at its ESM (.mjs) build. Jest's transform pipeline
  // does not cover .mjs by default, so that file gets require()'d raw
  // and fails with an ESM syntax error regardless of
  // transformIgnorePatterns (proven: cleared the Jest cache and
  // confirmed the regex itself does not match this file - the .mjs
  // extension is the actual blocker). Redirecting to the package's
  // own CJS build sidesteps it without touching every other package's
  // export-condition resolution.
  moduleNameMapper: {
    "^lucide-react-native$": cjsEntry,
  },
};
