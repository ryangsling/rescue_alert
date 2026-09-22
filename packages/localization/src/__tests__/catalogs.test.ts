import { describe, expect, it } from "vitest";
import { en } from "../catalogs/en";
import { bn } from "../catalogs/bn";

/**
 * bn.ts's `Record<keyof typeof en, string>` typing already makes a
 * missing or extra key a TypeScript compile error (excess-property
 * checking on the object literal). This test is the Part 6 task's
 * explicit runtime/CI-level check on top of that, so parity failures
 * surface in `pnpm test` too, not only `tsc`.
 */
describe("catalog parity", () => {
  const enKeys = Object.keys(en).sort();
  const bnKeys = Object.keys(bn).sort();

  it("has identical key sets in both catalogs", () => {
    expect(bnKeys).toEqual(enKeys);
  });

  it("has no empty values in either catalog", () => {
    for (const key of enKeys) {
      expect(en[key as keyof typeof en].length).toBeGreaterThan(0);
      expect(bn[key as keyof typeof bn].length).toBeGreaterThan(0);
    }
  });

  it("preserves matching {param} placeholders between catalogs", () => {
    const placeholderPattern = /\{(\w+)\}/g;
    for (const key of enKeys) {
      const enPlaceholders = [
        ...en[key as keyof typeof en].matchAll(placeholderPattern),
      ]
        .map((m) => m[1])
        .sort();
      const bnPlaceholders = [
        ...bn[key as keyof typeof bn].matchAll(placeholderPattern),
      ]
        .map((m) => m[1])
        .sort();
      expect(bnPlaceholders, `placeholders for "${key}"`).toEqual(
        enPlaceholders,
      );
    }
  });

  it("bn values contain actual Bengali script, not untranslated ASCII", () => {
    const bengaliRange = /[ঀ-৿]/;
    for (const key of bnKeys) {
      expect(
        bn[key as keyof typeof bn],
        `"${key}" should contain Bengali script`,
      ).toMatch(bengaliRange);
    }
  });
});
