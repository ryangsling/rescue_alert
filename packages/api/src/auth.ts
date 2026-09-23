import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type { RegistrationInput, SignInInput } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/**
 * AUTH-001. profiles/user_private_details are provisioned by the
 * handle_new_user database trigger (Part 3/7 migration) from this
 * metadata, not by a second client-side insert - see that trigger's
 * comment for why (email confirmation may still be pending when this
 * call returns, so there is no authenticated session yet to write
 * with).
 */
export async function registerUser(
  client: Client,
  input: RegistrationInput,
  options?: { emailRedirectTo?: string },
) {
  return client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: options?.emailRedirectTo,
      data: {
        full_name: input.fullName,
        city: input.city ?? null,
        area: input.area ?? null,
        preferred_language: input.preferredLanguage,
        phone_normalized: input.phone,
        terms_accepted: input.termsAccepted,
        privacy_notice_accepted: input.privacyNoticeAccepted,
        location_policy_accepted: input.locationPolicyAccepted,
        community_rules_accepted: input.communityRulesAccepted,
      },
    },
  });
}

/** AUTH-003. */
export async function signIn(client: Client, input: SignInInput) {
  return client.auth.signInWithPassword(input);
}

/** AUTH-007, current device only. */
export async function signOutCurrentDevice(client: Client) {
  return client.auth.signOut({ scope: "local" });
}

/**
 * AUTH-007, every device. Requires the secret key (auth.admin.signOut
 * with the caller's own access token - see the Edge Function's
 * comments for why it takes a token, not a user id), so this is a
 * privileged Edge Function call, never a direct client operation.
 */
export function signOutAllDevices(
  client: Client,
): ReturnType<Client["functions"]["invoke"]> {
  return client.functions.invoke("sign-out-all-devices", { method: "POST" });
}

/**
 * AUTH-005, AUTH-006: Supabase's own resetPasswordForEmail does not
 * reveal whether the email belongs to an account - it returns success
 * regardless, which is exactly the AUTH-006 behavior this needs.
 */
export async function requestPasswordReset(
  client: Client,
  email: string,
  redirectTo: string,
) {
  return client.auth.resetPasswordForEmail(email, { redirectTo });
}

/** Called after the user follows the recovery email link, which establishes a recovery session. */
export async function confirmPasswordReset(
  client: Client,
  newPassword: string,
) {
  return client.auth.updateUser({ password: newPassword });
}

/**
 * AUTH-008, AUTH-010. See supabase/functions/delete-account for why
 * this anonymizes and bans rather than hard-deleting the account.
 */
export function requestAccountDeletion(
  client: Client,
  currentPassword: string,
): ReturnType<Client["functions"]["invoke"]> {
  return client.functions.invoke("delete-account", {
    method: "POST",
    body: { currentPassword },
  });
}
