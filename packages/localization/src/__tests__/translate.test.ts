import { describe, expect, it } from "vitest";
import { translate } from "../translate";

describe("translate", () => {
  it("returns the plain catalog string when there are no params", () => {
    expect(translate("en", "action_submit")).toBe("Submit");
    expect(translate("bn", "action_submit")).toBe("জমা দিন");
  });

  it("interpolates a named placeholder", () => {
    expect(translate("en", "content_last_seen_minutes", { minutes: 12 })).toBe(
      "Animal last seen 12 minutes ago",
    );
    expect(translate("bn", "content_last_seen_minutes", { minutes: 12 })).toBe(
      "প্রাণীটি 12 মিনিট আগে দেখা গেছে",
    );
  });

  it("leaves an unmatched placeholder token untouched", () => {
    expect(translate("en", "content_last_seen_minutes", {})).toBe(
      "Animal last seen {minutes} minutes ago",
    );
  });
});
