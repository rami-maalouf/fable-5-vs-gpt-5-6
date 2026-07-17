import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { PreparedPhoto } from '@/domain/scan-machine';

const maximumLongEdge = 1_024;

export type ImageSource = {
  uri: string;
  width: number;
  height: number;
};

export async function pickLibraryImage(): Promise<ImageSource | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    allowsMultipleSelection: false,
    base64: false,
    mediaTypes: ['images'],
    quality: 1,
    selectionLimit: 1,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  getPreparedDimensions(asset.width, asset.height);

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}

export function getPreparedDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('invalid image dimensions');
  }

  const longEdge = Math.max(width, height);
  if (longEdge <= maximumLongEdge) {
    return { width, height };
  }

  const scale = maximumLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function prepareImage(source: ImageSource): Promise<PreparedPhoto> {
  const dimensions = getPreparedDimensions(source.width, source.height);
  const context = ImageManipulator.manipulate(source.uri);

  if (source.width > maximumLongEdge || source.height > maximumLongEdge) {
    if (source.width >= source.height) {
      context.resize({ width: dimensions.width });
    } else {
      context.resize({ height: dimensions.height });
    }
  }

  const renderedImage = await context.renderAsync();
  const savedImage = await renderedImage.saveAsync({
    base64: true,
    compress: 0.82,
    format: SaveFormat.JPEG,
  });

  if (!savedImage.base64) {
    throw new Error('prepared image is missing base64 data');
  }

  return {
    uri: savedImage.uri,
    width: savedImage.width,
    height: savedImage.height,
    base64: savedImage.base64,
  };
}
