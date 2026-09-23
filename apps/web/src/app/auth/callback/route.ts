import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

/**
 * Lands both email-confirmation and password-recovery links (AUTH's
 * PRD 7.1 step 4 and AUTH-005). Relies on Supabase's own default
 * email templates and hosted verify endpoint - no dashboard template
 * change needed - since emailRedirectTo/redirectTo (set on the
 * signUp() and resetPasswordForEmail() calls) point here with a PKCE
 * `code`. Exchanging it establishes the session either way; `next`
 * decides where that session is used (home, already signed in, vs
 * reset-password, to set a new one).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
