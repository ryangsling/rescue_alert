// See apps/mobile/jest.config.js for why the .pnpm segment matters.
const RN_PACKAGES =
  "(jest-)?react-native|@react-native(-community)?/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|lucide-react-native";

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${RN_PACKAGES}))`,
  ],
};
