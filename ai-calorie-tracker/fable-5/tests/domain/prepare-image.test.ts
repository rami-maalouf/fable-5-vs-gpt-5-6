// prepare-image contract: aspect ratio preserved, resize only when the long
// edge exceeds 1024, jpeg 0.82 export with raw base64.
const mockManipulate = jest.fn();
const mockResize = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: (...args: unknown[]) => mockManipulate(...args),
  },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

import {
  JPEG_QUALITY,
  MAX_LONG_EDGE,
  prepareImage,
  targetSize,
} from '../../src/services/prepare-image';

function givenSavedImage(width: number, height: number, base64 = 'cGl4ZWxz') {
  mockSaveAsync.mockResolvedValue({
    uri: 'file:///cache/prepared.jpg',
    width,
    height,
    base64,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  const context = { resize: mockResize, renderAsync: mockRenderAsync };
  mockManipulate.mockReturnValue(context);
  mockResize.mockReturnValue(context);
  mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
});

describe('targetSize', () => {
  it('is null when the long edge is at or below 1024', () => {
    expect(targetSize(800, 600)).toBeNull();
    expect(targetSize(1024, 768)).toBeNull();
    expect(targetSize(600, 1024)).toBeNull();
  });

  it('caps the long edge at exactly 1024 and preserves ratio', () => {
    expect(targetSize(1536, 2048)).toEqual({ width: 768, height: 1024 });
    expect(targetSize(2048, 1024)).toEqual({ width: 1024, height: 512 });
  });

  it('rounds odd dimensions without exceeding the cap', () => {
    const size = targetSize(3021, 4032);
    expect(size).toEqual({ width: 767, height: 1024 });
    expect(Math.max(size!.width, size!.height)).toBe(MAX_LONG_EDGE);
    // rounded ratio stays within one pixel of the source ratio
    expect(size!.width / size!.height).toBeCloseTo(3021 / 4032, 2);
  });
});

describe('prepareImage', () => {
  it('resizes a large portrait photo to a 1024 long edge', async () => {
    givenSavedImage(768, 1024);

    const photo = await prepareImage({
      uri: 'file:///picked/portrait.heic',
      width: 1536,
      height: 2048,
    });

    expect(mockManipulate).toHaveBeenCalledWith('file:///picked/portrait.heic');
    expect(mockResize).toHaveBeenCalledTimes(1);
    expect(mockResize).toHaveBeenCalledWith({ width: 768, height: 1024 });
    expect(photo.width / photo.height).toBeCloseTo(1536 / 2048, 5);
    expect(Math.max(photo.width, photo.height)).toBe(MAX_LONG_EDGE);
  });

  it('resizes a large landscape photo to a 1024 long edge', async () => {
    givenSavedImage(1024, 512);

    const photo = await prepareImage({
      uri: 'file:///picked/landscape.jpg',
      width: 2048,
      height: 1024,
    });

    expect(mockResize).toHaveBeenCalledWith({ width: 1024, height: 512 });
    expect(photo.width / photo.height).toBeCloseTo(2048 / 1024, 5);
    expect(Math.max(photo.width, photo.height)).toBe(MAX_LONG_EDGE);
  });

  it('never resizes a small photo', async () => {
    givenSavedImage(800, 600);

    const photo = await prepareImage({
      uri: 'file:///picked/small.jpg',
      width: 800,
      height: 600,
    });

    expect(mockResize).not.toHaveBeenCalled();
    expect(photo.width).toBe(800);
    expect(photo.height).toBe(600);
  });

  it('never resizes a photo whose long edge is exactly 1024', async () => {
    givenSavedImage(1024, 768);

    await prepareImage({
      uri: 'file:///picked/exact.jpg',
      width: 1024,
      height: 768,
    });

    expect(mockResize).not.toHaveBeenCalled();
  });

  it('exports jpeg at 0.82 quality with base64 requested', async () => {
    givenSavedImage(640, 480);

    await prepareImage({
      uri: 'file:///picked/any.jpg',
      width: 640,
      height: 480,
    });

    expect(mockSaveAsync).toHaveBeenCalledTimes(1);
    expect(mockSaveAsync).toHaveBeenCalledWith({
      format: 'jpeg',
      compress: JPEG_QUALITY,
      base64: true,
    });
    expect(JPEG_QUALITY).toBe(0.82);
  });

  it('returns the saved uri and raw base64 with no data-url prefix', async () => {
    givenSavedImage(640, 480, 'cGl4ZWxz');

    const photo = await prepareImage({
      uri: 'file:///picked/any.jpg',
      width: 640,
      height: 480,
    });

    expect(photo.uri).toBe('file:///cache/prepared.jpg');
    expect(photo.base64).toBe('cGl4ZWxz');
  });

  it('strips a data-url prefix if a platform ever adds one', async () => {
    givenSavedImage(640, 480, 'data:image/jpeg;base64,cGl4ZWxz');

    const photo = await prepareImage({
      uri: 'file:///picked/any.jpg',
      width: 640,
      height: 480,
    });

    expect(photo.base64).toBe('cGl4ZWxz');
  });

  it('throws when the manipulator returns no base64', async () => {
    mockSaveAsync.mockResolvedValue({
      uri: 'file:///cache/prepared.jpg',
      width: 640,
      height: 480,
    });

    await expect(
      prepareImage({ uri: 'file:///picked/any.jpg', width: 640, height: 480 }),
    ).rejects.toThrow('missing base64');
  });
});
