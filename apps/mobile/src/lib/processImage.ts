import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { hasJpegExifMarker, sniffImageContentType } from "@rescue-alert/media";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export interface ProcessedImage {
  uri: string;
  contentType: "image/jpeg";
  bytes: Uint8Array;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * CASE-004/005 mobile path. expo-image-manipulator's renderAsync()
 * only ever has decoded pixel data to draw from and only ever writes
 * a fresh JPEG from it (same reasoning as apps/web/src/lib/
 * processImage.ts's canvas path) - there is no EXIF segment for the
 * encoder to carry over. hasJpegExifMarker() is the verification
 * step, not the stripping mechanism.
 *
 * A first, action-less render is needed to read the source image's
 * width/height (ImageManipulatorContext exposes no dimensions before
 * rendering), so this makes two native round trips rather than one.
 */
export async function processImageForUpload(
  uri: string,
): Promise<ProcessedImage> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(original.width, original.height),
  );
  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context.resize({
      width: Math.round(original.width * scale),
      height: Math.round(original.height * scale),
    });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });

  if (!saved.base64) {
    throw new Error("encode_failed");
  }
  const bytes = base64ToBytes(saved.base64);

  if (sniffImageContentType(bytes) !== "image/jpeg") {
    throw new Error("unexpected_content_type_after_reencode");
  }
  if (hasJpegExifMarker(bytes)) {
    throw new Error("exif_marker_present_after_reencode");
  }

  return { uri: saved.uri, contentType: "image/jpeg", bytes };
}

/**
 * Reads bytes back from a URI processImageForUpload already produced
 * (report.tsx persists only the resulting URI to the draft, not the
 * bytes) without re-running it through the manipulator - the file on
 * disk is already the final compressed, EXIF-stripped JPEG, so this
 * is a plain read, mirroring apps/web/src/lib/processImage.ts's
 * dataUrlToBlob (decode only, no re-encode). Re-verifies the same two
 * invariants immediately before upload rather than trusting the
 * earlier check still holds.
 */
export async function readProcessedImageBytes(
  uri: string,
): Promise<Uint8Array> {
  const buffer = await new File(uri).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (sniffImageContentType(bytes) !== "image/jpeg") {
    throw new Error("unexpected_content_type_on_read");
  }
  if (hasJpegExifMarker(bytes)) {
    throw new Error("exif_marker_present_on_read");
  }

  return bytes;
}
