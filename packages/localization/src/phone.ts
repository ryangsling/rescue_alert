/**
 * Display formatting only - never the source of truth. The canonical
 * normalized form (+8801XXXXXXXXX) is enforced by a database CHECK
 * constraint (Part 3, user_private_details.phone_normalized) and by
 * AUTH-002; this function never feeds back into that value, matching
 * the Part 6 task "keep phone normalization separate from display
 * formatting".
 */
export function formatPhoneForDisplay(normalizedPhone: string): string {
  const match = /^\+880(1\d{3})(\d{6})$/.exec(normalizedPhone);
  if (!match) return normalizedPhone;
  const [, block1, block2] = match;
  return `+880 ${block1}-${block2}`;
}
