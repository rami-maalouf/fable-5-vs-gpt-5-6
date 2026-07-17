// turns a picked photo into the exact jpeg the backend contract expects:
// aspect ratio preserved, resize only when the long edge exceeds 1024 px,
// jpeg exported at 0.82 quality, raw base64 with no data-url prefix.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { PreparedPhoto } from '@/domain/scan-machine';

export const MAX_LONG_EDGE = 1024;
export const JPEG_QUALITY = 0.82;

export type SourceImage = {
  uri: string;
  // dimensions come from the picker asset, not from re-decoding the file
  width: number;
  height: number;
};

// null means the image is already within bounds and must not be resized
export function targetSize(
  width: number,
  height: number,
): { width: number; height: number } | null {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_LONG_EDGE) {
    return null;
  }
  const scale = MAX_LONG_EDGE / longEdge;
  return width >= height
    ? { width: MAX_LONG_EDGE, height: Math.round(height * scale) }
    : { width: Math.round(width * scale), height: MAX_LONG_EDGE };
}

// the manipulator returns raw base64, but strip defensively so the backend
// contract (raw base64, no data-url prefix) can never be violated
function stripDataUrlPrefix(base64: string): string {
  if (!base64.startsWith('data:')) {
    return base64;
  }
  const commaIndex = base64.indexOf(',');
  return commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;
}

export async function prepareImage(
  source: SourceImage,
): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(source.uri);
  const size = targetSize(source.width, source.height);
  if (size) {
    context.resize(size);
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!saved.base64) {
    throw new Error('prepared image is missing base64 data');
  }
  return {
    uri: saved.uri,
    base64: stripDataUrlPrefix(saved.base64),
    width: saved.width,
    height: saved.height,
  };
}
