import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoadingState, SafeAreaContainer } from "@rescue-alert/ui";
import { supabase } from "../supabase-client";

/**
 * Lands both email-confirmation and password-recovery deep links
 * (rescuealert://auth-callback?code=...&next=...), the mobile
 * equivalent of apps/web's /auth/callback route handler. Exchanging
 * the PKCE code establishes the session either way; `next` decides
 * where that session is used.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; next?: string }>();
  const router = useRouter();

  useEffect(() => {
    async function run() {
      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (!error) {
          router.replace((params.next as "/") ?? "/");
          return;
        }
      }
      router.replace("/sign-in");
    }
    void run();
  }, [params.code, params.next, router]);

  return (
    <SafeAreaContainer>
      <LoadingState />
    </SafeAreaContainer>
  );
}
