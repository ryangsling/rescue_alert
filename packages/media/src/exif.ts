/**
 * CASE-005 pre-upload safety check. The actual stripping happens by
 * re-encoding the image (canvas on web, expo-image-manipulator on
 * mobile - both decode to raw pixels and write a fresh file, which
 * structurally cannot carry over an EXIF segment neither encoder is
 * told to write). This function is the verification step run on the
 * re-encoded bytes immediately before upload: if a JPEG's APP1 segment
 * still carries an "Exif" signature, stripping silently failed (or
 * was skipped) and the upload must be blocked rather than proceeding
 * on trust - the database's exif_stripped CHECK constraint (Part 8
 * migration) only catches the caller lying about it, not this.
 *
 * Walks real JPEG segment structure (SOI, then FF-prefixed marker
 * segments with a 2-byte big-endian length) rather than just
 * substring-searching for "Exif", since a substring search could
 * false-negative on data that happens to contain "Exif" outside an
 * APP1 segment, or false-positive on encoded pixel data.
 */
export function hasJpegExifMarker(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return false; // not a JPEG (SOI marker missing)
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break; // malformed marker sequence - stop rather than misread

    const marker = bytes[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI or start-of-scan: no more metadata segments follow

    const segmentLength =
      ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);

    if (marker === 0xe1) {
      const sigStart = offset + 4;
      if (
        bytes[sigStart] === 0x45 && // E
        bytes[sigStart + 1] === 0x78 && // x
        bytes[sigStart + 2] === 0x69 && // i
        bytes[sigStart + 3] === 0x66 // f
      ) {
        return true;
      }
    }

    offset += 2 + segmentLength;
  }

  return false;
}
