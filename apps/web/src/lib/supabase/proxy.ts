import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@rescue-alert/types";

/**
 * Refreshes the auth session on every request so Server Components
 * never see a stale/expired token. Deliberately does not redirect
 * unauthenticated requests: this MVP has public routes (the public
 * share pages Part 16 builds, the home page) as well as authenticated
 * ones, so route-level protection belongs on those specific
 * pages/layouts, not a blanket proxy-level gate.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims() - see
  // Supabase's SSR guide: a simple mistake here can randomly log
  // users out. getClaims() (not getSession()/getUser()) validates the
  // JWT signature against the project's published keys every call.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
