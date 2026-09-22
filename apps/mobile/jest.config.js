// pnpm nests packages as node_modules/.pnpm/<name>@<version>/node_modules/<name>/,
// not the flat node_modules/<name>/ that most React Native
// transformIgnorePatterns examples assume - the pattern below allows
// an optional `.pnpm/<anything>/` segment before the package name so
// RN/Expo packages still get transformed regardless of which
// node_modules layer resolved them.
const RN_PACKAGES =
  "(jest-)?react-native|@react-native(-community)?/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop";

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${RN_PACKAGES}))`,
  ],
};
