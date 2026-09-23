import { describe, expect, it } from "vitest";
import { hasJpegExifMarker } from "../exif";

// Minimal real JPEG segment structures (not full valid images - just
// enough marker/length framing for the walker to parse correctly),
// each traced by hand against hasJpegExifMarker's own offset math.

// SOI, APP0/JFIF-shaped segment (length 4, 2 dummy payload bytes), SOS.
const JPEG_WITHOUT_EXIF = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0xaa, 0xbb, 0xff, 0xda,
]);

// SOI, APP1 segment (length 10) whose payload starts with the "Exif" signature, SOS.
const JPEG_WITH_EXIF = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x0a, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff,
  0xda,
]);

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe("hasJpegExifMarker", () => {
  it("detects an APP1 segment carrying the Exif signature", () => {
    expect(hasJpegExifMarker(JPEG_WITH_EXIF)).toBe(true);
  });

  it("returns false for a JPEG with no APP1/Exif segment", () => {
    expect(hasJpegExifMarker(JPEG_WITHOUT_EXIF)).toBe(false);
  });

  it("returns false for a non-JPEG (no SOI marker)", () => {
    expect(hasJpegExifMarker(PNG_BYTES)).toBe(false);
  });

  it("returns false for bytes too short to contain a marker", () => {
    expect(hasJpegExifMarker(new Uint8Array([0xff, 0xd8]))).toBe(false);
  });
});
