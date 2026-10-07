/**
 * PRD 12.x privacy warning: a comment, reply, or update containing
 * what looks like a phone number or email address gets a warning
 * before posting (not a block - a genuine reason to share contact
 * details, e.g. a clinic's own public number, is always possible).
 *
 * Deliberately permissive pattern matching over a precise parser:
 * missing a real phone number is the failure mode to avoid, not an
 * occasional false positive on a long digit sequence.
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// A Bangladesh mobile number in any spacing/prefix form, or any other
// run of 7+ digits (allowing spaces, dashes, and one leading +) that
// is likely a phone number rather than, say, a case reference code.
const PHONE_PATTERN = /(\+?880|0)?1[0-9](?:[\s-]?\d){8}|\+?\d(?:[\s-]?\d){6,}/;

export function containsPersonalContactInfo(text: string): boolean {
  return EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text);
}
