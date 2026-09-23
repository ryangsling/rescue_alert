// Official mock: the real native module is unavailable under Jest
// (proven directly - importing it threw "NativeModule: AsyncStorage
// is null" as soon as any screen imported src/supabase-client.ts).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// createClient() throws synchronously on import if these are unset -
// proven directly ("supabaseUrl is required") as soon as any screen
// imported src/supabase-client.ts. Render tests never call the
// network, so a well-formed placeholder is enough; real values (from
// .env.local, loaded by `expo lint`/`expo start`, not by Jest) still
// take precedence when present.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
