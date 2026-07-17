import { ImageManipulator } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  getPreparedDimensions,
  pickLibraryImage,
  prepareImage,
} from '../../src/services/prepare-image';

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: jest.fn(),
  },
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

const mockManipulate = ImageManipulator.manipulate as jest.Mock;
const mockLaunchImageLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockResize = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

describe('photo preparation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResize.mockReturnThis();
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockSaveAsync.mockResolvedValue({
      uri: 'file:///prepared.jpg',
      width: 1_024,
      height: 512,
      base64: 'raw-jpeg-base64',
    });
    mockManipulate.mockReturnValue({
      resize: mockResize,
      renderAsync: mockRenderAsync,
    });
  });

  it.each([
    [800, 1_600, { width: 512, height: 1_024 }],
    [1_600, 800, { width: 1_024, height: 512 }],
    [640, 480, { width: 640, height: 480 }],
    [4_032, 3_024, { width: 1_024, height: 768 }],
  ])(
    'fits %sx%s within the long-edge limit without changing aspect ratio',
    (width, height, expected) => {
      expect(getPreparedDimensions(width, height)).toEqual(expected);
    },
  );

  it('resizes landscape input once and saves exact jpeg output with raw base64', async () => {
    await expect(
      prepareImage({
        uri: 'file:///selected.heic',
        width: 1_600,
        height: 800,
      }),
    ).resolves.toEqual({
      uri: 'file:///prepared.jpg',
      width: 1_024,
      height: 512,
      base64: 'raw-jpeg-base64',
    });

    expect(mockManipulate).toHaveBeenCalledWith('file:///selected.heic');
    expect(mockResize).toHaveBeenCalledTimes(1);
    expect(mockResize).toHaveBeenCalledWith({ width: 1_024 });
    expect(mockRenderAsync).toHaveBeenCalledTimes(1);
    expect(mockSaveAsync).toHaveBeenCalledWith({
      base64: true,
      compress: 0.82,
      format: 'jpeg',
    });
  });

  it('returns cancellation without preparing an error state', async () => {
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickLibraryImage()).resolves.toBeNull();
    expect(mockLaunchImageLibrary).toHaveBeenCalledWith({
      allowsEditing: false,
      allowsMultipleSelection: false,
      base64: false,
      mediaTypes: ['images'],
      quality: 1,
      selectionLimit: 1,
    });
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('returns exactly one selected photo source for preparation', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///meal.jpg',
          width: 800,
          height: 1_600,
        },
      ],
    });

    await expect(pickLibraryImage()).resolves.toEqual({
      uri: 'file:///meal.jpg',
      width: 800,
      height: 1_600,
    });
  });

  it('keeps a small image at native dimensions while still exporting jpeg', async () => {
    mockSaveAsync.mockResolvedValue({
      uri: 'file:///small-prepared.jpg',
      width: 640,
      height: 480,
      base64: 'small-raw-base64',
    });

    await prepareImage({ uri: 'file:///small.png', width: 640, height: 480 });

    expect(mockResize).not.toHaveBeenCalled();
    expect(mockRenderAsync).toHaveBeenCalledTimes(1);
    expect(mockSaveAsync).toHaveBeenCalledWith({
      base64: true,
      compress: 0.82,
      format: 'jpeg',
    });
  });

  it('rejects invalid dimensions and a native result without base64', async () => {
    expect(() => getPreparedDimensions(0, 800)).toThrow('invalid image dimensions');
    expect(() => getPreparedDimensions(Number.NaN, 800)).toThrow(
      'invalid image dimensions',
    );

    mockSaveAsync.mockResolvedValue({
      uri: 'file:///prepared.jpg',
      width: 1_024,
      height: 512,
    });

    await expect(
      prepareImage({ uri: 'file:///selected.jpg', width: 1_600, height: 800 }),
    ).rejects.toThrow('prepared image is missing base64 data');
  });
});
