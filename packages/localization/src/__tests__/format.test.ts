import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, formatTime } from "../format";

const SAMPLE_DATE = new Date("2026-09-23T10:30:00Z");

// timeZone: "UTC" is passed explicitly everywhere here so these
// assertions are deterministic in CI, which runs in UTC, not just on
// a Dhaka-local machine.
describe("formatDate", () => {
  it("formats with Bengali month name and numerals for bn", () => {
    expect(
      formatDate("bn", SAMPLE_DATE, { dateStyle: "long", timeZone: "UTC" }),
    ).toBe("২৩ সেপ্টেম্বর, ২০২৬");
  });

  it("formats with day-month-year order for en (en-IN, not en-US)", () => {
    expect(
      formatDate("en", SAMPLE_DATE, { dateStyle: "long", timeZone: "UTC" }),
    ).toBe("23 September 2026");
  });
});

describe("formatTime", () => {
  it("formats with Bengali numerals for bn", () => {
    expect(
      formatTime("bn", SAMPLE_DATE, { timeStyle: "short", timeZone: "UTC" }),
    ).toBe("১০:৩০ AM");
  });

  it("formats for en", () => {
    expect(
      formatTime("en", SAMPLE_DATE, { timeStyle: "short", timeZone: "UTC" }),
    ).toBe("10:30 am");
  });
});

describe("formatNumber", () => {
  it("uses lakh/crore grouping and Bengali numerals for bn", () => {
    expect(formatNumber("bn", 1234567)).toBe("১২,৩৪,৫৬৭");
  });

  it("uses South Asian digit grouping for en (en-IN, not en-US)", () => {
    expect(formatNumber("en", 1234567)).toBe("12,34,567");
  });
});
