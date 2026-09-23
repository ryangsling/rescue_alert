/**
 * CASE-004 task list item: "file type detection by content inspection,
 * not filename extension" - reads magic bytes rather than trusting a
 * name/extension a client (or an attacker) could set to anything.
 * Matches the three types the rescue-media Storage bucket allows
 * (Part 8 migration's allowed_mime_types).
 */
export type SniffedImageType = "image/jpeg" | "image/png" | "image/webp";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(
  bytes: Uint8Array,
  signature: readonly number[],
  offset = 0,
): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function sniffImageContentType(
  bytes: Uint8Array,
): SniffedImageType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
