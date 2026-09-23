// AUTH-008, AUTH-010. Account deletion is deliberately NOT
// auth.admin.deleteUser(): rescue_cases.creator_id, case_comments.
// author_id, and every other content-authorship/audit-trail column
// referencing profiles is ON DELETE NO ACTION (see the
// add_profile_deleted_at migration for how this was proven directly),
// protecting the audit trail AGENTS.md requires. Deleting the account
// instead means: verify the caller's current password (AUTH-010,
// "recent authentication" - a fresh password check *is* the recency
// proof), anonymize their personal data in place, and ban the
// underlying auth user so it can never sign in again.
//
// Uses SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS - see
// sign-out-all-devices for why, and for why admin.signOut() takes the
// caller's own access token JWT, not their user id.
import { createClient } from "npm:@supabase/supabase-js@2";

interface DeleteAccountRequest {
  currentPassword: string;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
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
  if (userError || !userData.user?.email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;
  const email = userData.user.email;

  let body: DeleteAccountRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.currentPassword) {
    return Response.json(
      { error: "current_password_required" },
      { status: 400 },
    );
  }

  const verifyClient = createClient(url, publishableKey);
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email,
    password: body.currentPassword,
  });
  if (verifyError) {
    return Response.json(
      { error: "current_password_incorrect" },
      { status: 401 },
    );
  }

  const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default;
  const adminClient = createClient(url, secretKey);

  const { error: privateDetailsError } = await adminClient
    .from("user_private_details")
    .delete()
    .eq("user_id", userId);
  if (privateDetailsError) {
    return Response.json({ error: "delete_failed" }, { status: 500 });
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: "Deleted user",
      city: null,
      area: null,
      bio: null,
      avatar_url: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profileError) {
    return Response.json({ error: "delete_failed" }, { status: 500 });
  }

  const { error: banError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      ban_duration: "876000h",
    },
  );
  if (banError) {
    return Response.json({ error: "delete_failed" }, { status: 500 });
  }

  await adminClient.auth.admin.signOut(accessToken, "global");

  return Response.json({ success: true });
});
