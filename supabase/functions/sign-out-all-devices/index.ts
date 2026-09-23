// AUTH-007: sign out of all devices.
//
// auth.admin.signOut() takes the user's own access token JWT, not
// their user id - confirmed via the Supabase docs (Swift reference:
// "Signs out a specific user ... using that user's access token
// (JWT)") after a UUID first argument produced "token contains an
// invalid number of segments" (a UUID has no "." characters; a JWT
// needs two). The incoming Authorization header already carries that
// exact token, so it is reused directly rather than the user id
// auth.getUser() returns.
//
// Uses SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS (the current
// key model), not the legacy-named env vars: proven directly via a
// diagnostic function that this project's SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY env vars are themselves just aliases to
// the same new-format key strings here, not real legacy JWTs.
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS: apps/web calls this cross-origin from the browser, which
// requires an explicit preflight response - found directly (a real
// browser call failed with a CORS error, not a function error) rather
// than assumed. apps/mobile isn't affected (no browser CORS
// enforcement), but this is required for any web caller.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const url = Deno.env.get("SUPABASE_URL")!;
  const publishableKey = JSON.parse(
    Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!,
  ).default;
  const callerClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } =
    await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default;
  const adminClient = createClient(url, secretKey);

  const { error } = await adminClient.auth.admin.signOut(accessToken, "global");
  if (error) {
    return Response.json(
      { error: "sign_out_failed" },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json({ success: true }, { headers: corsHeaders });
});
