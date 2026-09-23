import { describe, expect, it } from "vitest";
import { sniffImageContentType } from "../contentType";

describe("sniffImageContentType", () => {
  it("detects PNG by its 8-byte signature", () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    expect(sniffImageContentType(bytes)).toBe("image/png");
  });

  it("detects JPEG by its FF D8 FF prefix", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00]);
    expect(sniffImageContentType(bytes)).toBe("image/jpeg");
  });

  it("detects WEBP by its RIFF....WEBP framing", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageContentType(bytes)).toBe("image/webp");
  });

  it("returns null for an unrecognized byte sequence, regardless of any filename claim", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(sniffImageContentType(bytes)).toBeNull();
  });

  it("returns null for a RIFF file that isn't WEBP (e.g. a WAV)", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(sniffImageContentType(bytes)).toBeNull();
  });

  it("returns null for bytes too short to match any signature", () => {
    expect(sniffImageContentType(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});
