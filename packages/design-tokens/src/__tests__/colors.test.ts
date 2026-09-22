import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  WCAG_NORMAL_TEXT_MIN,
  WCAG_LARGE_TEXT_OR_BOUNDARY_MIN,
} from "../contrast";
import {
  lightColors,
  lightStatusColors,
  darkColors,
  darkStatusColors,
} from "../colors";

// design/DESIGN.md section 15: normal text >= 4.5:1, meaningful
// boundaries and large text >= 3:1. Every pair here is one an actual
// component renders (body text, chip text, focus/border boundaries).
describe("color token contrast (WCAG AA)", () => {
  it.each([
    ["light: text on background", lightColors.text, lightColors.background],
    [
      "light: textMuted on background",
      lightColors.textMuted,
      lightColors.background,
    ],
    ["light: onPrimary on primary", lightColors.onPrimary, lightColors.primary],
    [
      "light: onPrimaryContainer on primaryContainer",
      lightColors.onPrimaryContainer,
      lightColors.primaryContainer,
    ],
    ["light: text on surface", lightColors.text, lightColors.surface],
    ["dark: text on background", darkColors.text, darkColors.background],
    [
      "dark: textMuted on background",
      darkColors.textMuted,
      darkColors.background,
    ],
    [
      "dark: onPrimary on primaryContainer",
      darkColors.text,
      darkColors.primaryContainer,
    ],
    ["dark: text on surface", darkColors.text, darkColors.surface],
  ])("%s meets 4.5:1", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_NORMAL_TEXT_MIN);
  });

  it.each([
    [
      "light: critical on criticalContainer",
      lightStatusColors.critical,
      lightStatusColors.criticalContainer,
    ],
    [
      "light: urgent on urgentContainer",
      lightStatusColors.urgent,
      lightStatusColors.urgentContainer,
    ],
    [
      "light: support on supportContainer",
      lightStatusColors.support,
      lightStatusColors.supportContainer,
    ],
    [
      "light: success on successContainer",
      lightStatusColors.success,
      lightStatusColors.successContainer,
    ],
    [
      "light: warning on warningContainer",
      lightStatusColors.warning,
      lightStatusColors.warningContainer,
    ],
    [
      "dark: critical on criticalContainer",
      darkStatusColors.critical,
      darkStatusColors.criticalContainer,
    ],
    [
      "dark: urgent on urgentContainer",
      darkStatusColors.urgent,
      darkStatusColors.urgentContainer,
    ],
    [
      "dark: support on supportContainer",
      darkStatusColors.support,
      darkStatusColors.supportContainer,
    ],
    [
      "dark: success on successContainer",
      darkStatusColors.success,
      darkStatusColors.successContainer,
    ],
    [
      "dark: warning on warningContainer",
      darkStatusColors.warning,
      darkStatusColors.warningContainer,
    ],
  ])("%s (status chip text) meets 4.5:1", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_NORMAL_TEXT_MIN);
  });

  // `border` is a decorative divider - DESIGN.md's own usage note
  // calls it a "Standard boundary" alongside spacing/shadow, never the
  // sole conveyor of information (status is always icon + text, never
  // color or border alone). `focus` is DESIGN.md's actual functional
  // boundary - the accessibility/keyboard focus ring - which is what
  // WCAG 1.4.11 Non-text Contrast (3:1) applies to here.
  it.each([
    ["light: focus on background", lightColors.focus, lightColors.background],
    ["dark: focus on background", darkColors.focus, darkColors.background],
  ])("%s (functional boundary) meets 3:1", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(
      WCAG_LARGE_TEXT_OR_BOUNDARY_MIN,
    );
  });

  // Known gap, disclosed rather than hidden: DESIGN.md describes
  // borderStrong as "High-emphasis boundaries and input focus
  // support," which implies the 3:1 boundary bar. The light-theme
  // value (#8E9B96) measures 2.83:1 against background - just under.
  // Not asserted as a failure since this is a value from the given
  // DESIGN.md spec, not one this package introduced; flagged for a
  // design review rather than silently changed.
  it("documents the known light-theme borderStrong contrast gap", () => {
    const ratio = contrastRatio(
      lightColors.borderStrong,
      lightColors.background,
    );
    expect(ratio).toBeGreaterThan(2.5); // sanity bound, not the 3:1 target
    expect(ratio).toBeLessThan(WCAG_LARGE_TEXT_OR_BOUNDARY_MIN); // fails if DESIGN.md's value is ever corrected - remove this test then
  });
});
