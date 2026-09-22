import type { Locale } from "./translate";

/**
 * Bangladesh-appropriate formatting per PRD section 22.5 / L10N-005.
 *
 * bn uses "bn-BD" directly - verified to give Bengali numerals, a
 * Bengali month name, and the correct lakh/crore digit grouping
 * (12,34,567, not 1,234,567).
 *
 * en uses "en-IN", not "en-US" or "en-BD": Node's ICU data has no
 * distinct "en-BD" locale (it silently falls back to generic English
 * Western-style grouping, confirmed by checking resolvedOptions()).
 * "en-IN" is used specifically for its CLDR South Asian digit-
 * grouping convention (12,34,567) and day-month-year date order,
 * which matches actual Bangladeshi English usage - not as any claim
 * that Bangladesh and India share a locale otherwise.
 */
const INTL_LOCALE: Record<Locale, string> = {
  bn: "bn-BD",
  en: "en-IN",
};

export function formatDate(
  locale: Locale,
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    INTL_LOCALE[locale],
    options ?? { dateStyle: "long" },
  ).format(date);
}

export function formatTime(
  locale: Locale,
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    INTL_LOCALE[locale],
    options ?? { timeStyle: "short" },
  ).format(date);
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(value);
}
