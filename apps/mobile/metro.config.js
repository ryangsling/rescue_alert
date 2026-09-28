const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports its wa-sqlite engine as a .wasm
// file (expo-sqlite/web/worker.ts). Metro's default assetExts has no
// "wasm" entry, so `expo export --platform web` fails to resolve it
// as a module - proven directly, this is the exact failure without
// this line. Registering it as an asset extension (not a source
// extension) is the documented fix for bundling expo-sqlite on web.
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./src/global.css" });
