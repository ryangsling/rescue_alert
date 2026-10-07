import { describe, expect, it } from "vitest";
import { buildMentionToken, splitMentionSegments } from "../mention";

describe("buildMentionToken", () => {
  it("wraps a name and id in the @[Name](id) shape", () => {
    expect(
      buildMentionToken("Rahim", "c100f342-7586-458f-b912-f4db3934a1f4"),
    ).toBe("@[Rahim](c100f342-7586-458f-b912-f4db3934a1f4)");
  });
});

describe("splitMentionSegments", () => {
  it("splits plain text around a mention token", () => {
    const body =
      "cc @[Rahim](c100f342-7586-458f-b912-f4db3934a1f4) can you confirm?";
    expect(splitMentionSegments(body)).toEqual([
      { type: "text", text: "cc " },
      {
        type: "mention",
        text: "Rahim",
        userId: "c100f342-7586-458f-b912-f4db3934a1f4",
      },
      { type: "text", text: " can you confirm?" },
    ]);
  });

  it("returns a single text segment when there is no mention", () => {
    expect(splitMentionSegments("no mentions here")).toEqual([
      { type: "text", text: "no mentions here" },
    ]);
  });

  it("handles two mentions in one body", () => {
    const body =
      "@[A](11111111-1111-1111-1111-111111111111) and @[B](22222222-2222-2222-2222-222222222222)";
    const segments = splitMentionSegments(body);
    expect(segments.filter((s) => s.type === "mention")).toHaveLength(2);
  });
});
