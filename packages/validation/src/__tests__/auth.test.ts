import { describe, expect, it } from "vitest";
import {
  passwordResetConfirmSchema,
  passwordSchema,
  registrationSchema,
  signInSchema,
} from "../auth";

const validRegistration = {
  fullName: "Test User",
  email: "test@example.com",
  phone: "01712345678",
  preferredLanguage: "en" as const,
  password: "password1",
  confirmPassword: "password1",
  termsAccepted: true as const,
  privacyNoticeAccepted: true as const,
  locationPolicyAccepted: true as const,
  communityRulesAccepted: true as const,
};

describe("passwordSchema", () => {
  it("accepts a password with a letter and a number, 8+ characters", () => {
    expect(passwordSchema.safeParse("abcd1234").success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });
});

describe("registrationSchema", () => {
  it("accepts a fully valid registration and normalizes the phone", () => {
    const result = registrationSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+8801712345678");
    }
  });

  it("rejects mismatched password confirmation", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      confirmPassword: "somethingElse1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed Bangladesh phone number", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when any consent flag is not exactly true", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      termsAccepted: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts email and a non-empty password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("passwordResetConfirmSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = passwordResetConfirmSchema.safeParse({
      password: "abcd1234",
      confirmPassword: "abcd9999",
    });
    expect(result.success).toBe(false);
  });
});
