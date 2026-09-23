import { z } from "zod";
import { normalizeBangladeshPhone } from "./phone";

/**
 * Baseline strength: Supabase Auth's own project-level minimum is 6
 * characters (verified directly against the live project), which is
 * weaker than this app wants to accept. This schema is the actual
 * floor for anything going through our own clients; the gap between
 * the two is disclosed in docs/PLAN.md Part 7, since closing it
 * requires a one-time Supabase dashboard change no available tool can
 * make on our behalf.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const bangladeshPhoneSchema = z.string().transform((value, ctx) => {
  const normalized = normalizeBangladeshPhone(value);
  if (!normalized) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid Bangladesh mobile number",
    });
    return z.NEVER;
  }
  return normalized;
});

/** AUTH-001. Consent flags become server-stamped timestamps in the handle_new_user trigger (Part 3/7). */
export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(200),
    email: z.email(),
    phone: bangladeshPhoneSchema,
    city: z.string().trim().max(200).optional(),
    area: z.string().trim().max(200).optional(),
    preferredLanguage: z.enum(["en", "bn"]),
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { message: "You must accept the terms" }),
    privacyNoticeAccepted: z.literal(true, {
      message: "You must accept the privacy notice",
    }),
    locationPolicyAccepted: z.literal(true, {
      message: "You must accept the location policy",
    }),
    communityRulesAccepted: z.literal(true, {
      message: "You must accept the community rules",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.email(),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
