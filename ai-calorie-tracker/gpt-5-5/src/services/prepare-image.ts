import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import type { PreparedScanPhoto } from "@/domain/scan-machine";

export type PrepareImageInput = {
  uri: string;
  width: number;
  height: number;
};

const MAX_PREPARED_IMAGE_LONG_EDGE = 1024;
const JPEG_COMPRESSION = 0.82;

export async function prepareImageForAnalysis(input: PrepareImageInput): Promise<PreparedScanPhoto> {
  if (!input.uri || input.width <= 0 || input.height <= 0) {
    throw new Error("image dimensions are required");
  }

  const context = ImageManipulator.manipulate(input.uri);
  const resize = getResizeDimensions(input.width, input.height);
  const renderedImage = await (resize ? context.resize(resize) : context).renderAsync();
  const savedImage = await renderedImage.saveAsync({
    base64: true,
    compress: JPEG_COMPRESSION,
    format: SaveFormat.JPEG,
  });

  if (!savedImage.base64) {
    throw new Error("prepared image is missing base64 data");
  }

  if (Math.max(savedImage.width, savedImage.height) > MAX_PREPARED_IMAGE_LONG_EDGE) {
    throw new Error("prepared image exceeds maximum dimensions");
  }

  return {
    uri: savedImage.uri,
    base64: savedImage.base64,
    width: savedImage.width,
    height: savedImage.height,
  };
}

function getResizeDimensions(width: number, height: number) {
  const longEdge = Math.max(width, height);

  if (longEdge <= MAX_PREPARED_IMAGE_LONG_EDGE) {
    return null;
  }

  const scale = MAX_PREPARED_IMAGE_LONG_EDGE / longEdge;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
