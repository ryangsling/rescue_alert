import { createClient } from "../lib/supabase/server";
import { AppHeaderNav } from "./app-header-nav";

/** Server-side auth/role check, same pattern as moderation/page.tsx - kept separate from AppHeaderNav since that part needs useLocale() and must be a client component. */
export async function AppHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ? String(data.claims.sub) : null;

  let isModerator = false;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    isModerator =
      !!profile && ["moderator", "administrator"].includes(profile.role);
  }

  return <AppHeaderNav isAuthenticated={!!userId} isModerator={isModerator} />;
}
