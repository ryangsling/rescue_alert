/**
 * AUTH-002: canonical Bangladesh mobile number format. Accepts
 * whatever a user is likely to type (leading 0, leading 880, with or
 * without +, with spaces or dashes) and normalizes to this one shape,
 * which is also enforced by the database CHECK constraint on
 * user_private_details.phone_normalized (Part 3).
 */
export const BD_MOBILE_PATTERN = /^\+8801[0-9]{9}$/;

/**
 * Returns the normalized `+8801XXXXXXXXX` form, or null if the input
 * cannot be normalized into a valid Bangladesh mobile number.
 */
export function normalizeBangladeshPhone(input: string): string | null {
  const stripped = input.replace(/[^\d+]/g, "");

  let candidate: string;
  if (stripped.startsWith("+880")) {
    candidate = stripped;
  } else if (stripped.startsWith("880")) {
    candidate = `+${stripped}`;
  } else if (stripped.startsWith("0")) {
    candidate = `+880${stripped.slice(1)}`;
  } else {
    candidate = `+880${stripped}`;
  }

  return BD_MOBILE_PATTERN.test(candidate) ? candidate : null;
}
