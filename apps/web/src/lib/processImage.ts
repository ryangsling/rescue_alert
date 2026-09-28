"use client";

import { hasJpegExifMarker, sniffImageContentType } from "@rescue-alert/media";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export interface ProcessedImage {
  dataUrl: string;
  contentType: "image/jpeg";
}

/**
 * CASE-004/005: compresses (resize + re-encode) and strips EXIF in
 * one step - a canvas 2D context only ever has decoded pixel data to
 * draw from, and toBlob("image/jpeg") only ever writes fresh JPEG
 * bytes from that pixel data, so the encoder has no EXIF segment to
 * carry over even if the source had one. hasJpegExifMarker() is the
 * verification step, not the stripping mechanism - if it ever fires
 * here, something is deeply wrong and the image must not be used.
 */
export async function processImageForUpload(
  file: File,
): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("encode_failed")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (sniffImageContentType(bytes) !== "image/jpeg") {
    throw new Error("unexpected_content_type_after_reencode");
  }
  if (hasJpegExifMarker(bytes)) {
    throw new Error("exif_marker_present_after_reencode");
  }

  return { dataUrl: await blobToDataUrl(blob), contentType: "image/jpeg" };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(reader.error?.message ?? "read_failed"));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
