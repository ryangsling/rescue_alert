import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  confirmPasswordReset,
  registerUser,
  requestAccountDeletion,
  requestPasswordReset,
  signIn,
  signOutAllDevices,
  signOutCurrentDevice,
} from "../auth";

/**
 * These are thin wrappers over supabase-js; the underlying behavior
 * (the handle_new_user trigger, the two Edge Functions, RLS) is
 * already proven against the live project during Part 7 development.
 * What's worth testing here, cheaply and without a network call, is
 * that each wrapper calls the right method with the right shape -
 * catching a typo or an argument-order mistake before it reaches a
 * live call.
 */
function stubClient(overrides: {
  signUp?: ReturnType<typeof vi.fn>;
  signInWithPassword?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
  resetPasswordForEmail?: ReturnType<typeof vi.fn>;
  updateUser?: ReturnType<typeof vi.fn>;
  invoke?: ReturnType<typeof vi.fn>;
}) {
  return {
    auth: {
      signUp: overrides.signUp ?? vi.fn(),
      signInWithPassword: overrides.signInWithPassword ?? vi.fn(),
      signOut: overrides.signOut ?? vi.fn(),
      resetPasswordForEmail: overrides.resetPasswordForEmail ?? vi.fn(),
      updateUser: overrides.updateUser ?? vi.fn(),
    },
    functions: {
      invoke: overrides.invoke ?? vi.fn(),
    },
  } as unknown as SupabaseClient<Database>;
}

const registration = {
  fullName: "Test User",
  email: "test@example.com",
  phone: "+8801712345678",
  preferredLanguage: "en" as const,
  password: "abcd1234",
  confirmPassword: "abcd1234",
  termsAccepted: true as const,
  privacyNoticeAccepted: true as const,
  locationPolicyAccepted: true as const,
  communityRulesAccepted: true as const,
};

describe("registerUser", () => {
  it("calls signUp with metadata matching what handle_new_user expects", async () => {
    const signUp = vi.fn();
    await registerUser(stubClient({ signUp }), registration);

    expect(signUp).toHaveBeenCalledWith({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          full_name: registration.fullName,
          city: null,
          area: null,
          preferred_language: "en",
          phone_normalized: registration.phone,
          terms_accepted: true,
          privacy_notice_accepted: true,
          location_policy_accepted: true,
          community_rules_accepted: true,
        },
      },
    });
  });
});

describe("signIn", () => {
  it("calls signInWithPassword with the given credentials", async () => {
    const signInWithPassword = vi.fn();
    const input = { email: "a@b.com", password: "x" };
    await signIn(stubClient({ signInWithPassword }), input);
    expect(signInWithPassword).toHaveBeenCalledWith(input);
  });
});

describe("signOutCurrentDevice", () => {
  it("uses local scope, not global", async () => {
    const signOut = vi.fn();
    await signOutCurrentDevice(stubClient({ signOut }));
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("signOutAllDevices", () => {
  it("invokes the sign-out-all-devices Edge Function", async () => {
    const invoke = vi.fn();
    await signOutAllDevices(stubClient({ invoke }));
    expect(invoke).toHaveBeenCalledWith("sign-out-all-devices", {
      method: "POST",
    });
  });
});

describe("requestPasswordReset", () => {
  it("passes the redirect URL through to resetPasswordForEmail", async () => {
    const resetPasswordForEmail = vi.fn();
    await requestPasswordReset(
      stubClient({ resetPasswordForEmail }),
      "a@b.com",
      "https://app/reset",
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith("a@b.com", {
      redirectTo: "https://app/reset",
    });
  });
});

describe("confirmPasswordReset", () => {
  it("calls updateUser with the new password", async () => {
    const updateUser = vi.fn();
    await confirmPasswordReset(stubClient({ updateUser }), "newPassword1");
    expect(updateUser).toHaveBeenCalledWith({ password: "newPassword1" });
  });
});

describe("requestAccountDeletion", () => {
  it("invokes delete-account with the current password in the body", async () => {
    const invoke = vi.fn();
    await requestAccountDeletion(stubClient({ invoke }), "myPassword1");
    expect(invoke).toHaveBeenCalledWith("delete-account", {
      method: "POST",
      body: { currentPassword: "myPassword1" },
    });
  });
});
