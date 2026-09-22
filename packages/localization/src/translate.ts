import { en, type TranslationKey } from "./catalogs/en";
import { bn } from "./catalogs/bn";

export type Locale = "en" | "bn";

const CATALOGS: Record<Locale, Record<TranslationKey, string>> = { en, bn };

/**
 * Every value in the catalogs is a complete sentence with named
 * interpolation placeholders ({param}) rather than fragments meant to
 * be concatenated (DESIGN.md section 16, Part 6 task list). This is
 * the only substitution mechanism in this package - there is no
 * string-concatenation helper to reach for instead.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = CATALOGS[locale][key];
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, paramName: string) =>
    Object.prototype.hasOwnProperty.call(params, paramName)
      ? String(params[paramName])
      : match,
  );
}
