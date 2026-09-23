import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@rescue-alert/types";

/**
 * `expo export --platform web` statically prerenders every route in
 * a Node environment with no `window` - proven directly, a bare
 * AsyncStorage here crashed that build with "ReferenceError: window
 * is not defined" (AsyncStorage's web implementation touches
 * browser storage APIs). This guard is the pattern Supabase's own
 * Expo guide uses for exactly this reason.
 */
const isSsr = typeof window === "undefined";

const ssrSafeStorage = {
  getItem: (key: string) =>
    isSsr ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    isSsr ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isSsr ? Promise.resolve() : AsyncStorage.removeItem(key),
};

/**
 * detectSessionInUrl: false - there is no browser URL bar on native;
 * email/reset links are handled as deep links (see auth-callback.tsx)
 * via expo-router, not by the Supabase client parsing window.location.
 */
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
