import { beforeEach, describe, expect, jest, test } from "@jest/globals";

type MockSavedImage = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
};

type MockRenderedImage = {
  width: number;
  height: number;
  saveAsync: typeof mockSaveAsync;
};

type MockManipulatorContext = {
  resize: typeof mockResize;
  renderAsync: typeof mockRenderAsync;
};

const mockSaveAsync = jest.fn<() => Promise<MockSavedImage>>();
const mockRenderAsync = jest.fn<() => Promise<MockRenderedImage>>();
const mockResize = jest.fn<(size: { width: number; height: number }) => MockManipulatorContext>();
const mockManipulate = jest.fn<(uri: string) => MockManipulatorContext>();

jest.mock("expo-image-manipulator", () => ({
  __esModule: true,
  ImageManipulator: {
    manipulate: mockManipulate,
  },
  SaveFormat: {
    JPEG: "jpeg",
  },
}));

const { prepareImageForAnalysis } =
  require("../../src/services/prepare-image") as typeof import("../../src/services/prepare-image");

function mockPreparedImage({
  renderedWidth,
  renderedHeight,
  savedUri = "file:///prepared.jpg",
  base64 = "prepared-base64",
}: {
  renderedWidth: number;
  renderedHeight: number;
  savedUri?: string;
  base64?: string;
}) {
  mockSaveAsync.mockResolvedValue({
    uri: savedUri,
    width: renderedWidth,
    height: renderedHeight,
    base64,
  });
  mockRenderAsync.mockResolvedValue({
    width: renderedWidth,
    height: renderedHeight,
    saveAsync: mockSaveAsync,
  });
  mockResize.mockReturnValue({
    resize: mockResize,
    renderAsync: mockRenderAsync,
  });
  mockManipulate.mockReturnValue({
    resize: mockResize,
    renderAsync: mockRenderAsync,
  });
}

describe("prepareImageForAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("resizes a large portrait image to a 1024px long edge and exports jpeg base64", async () => {
    mockPreparedImage({ renderedWidth: 768, renderedHeight: 1024 });

    const prepared = await prepareImageForAnalysis({
      uri: "ph://portrait",
      width: 3024,
      height: 4032,
    });

    expect(mockManipulate).toHaveBeenCalledWith("ph://portrait");
    expect(mockResize).toHaveBeenCalledWith({ width: 768, height: 1024 });
    expect(mockSaveAsync).toHaveBeenCalledWith({
      base64: true,
      compress: 0.82,
      format: "jpeg",
    });
    expect(prepared).toEqual({
      uri: "file:///prepared.jpg",
      base64: "prepared-base64",
      width: 768,
      height: 1024,
    });
  });

  test("resizes a large landscape image without changing aspect ratio", async () => {
    mockPreparedImage({ renderedWidth: 1024, renderedHeight: 683 });

    await prepareImageForAnalysis({
      uri: "file:///landscape.jpg",
      width: 6000,
      height: 4000,
    });

    expect(mockResize).toHaveBeenCalledWith({ width: 1024, height: 683 });
  });

  test("does not resize an image whose long edge is already at or below 1024px", async () => {
    mockPreparedImage({ renderedWidth: 640, renderedHeight: 480 });

    await prepareImageForAnalysis({
      uri: "file:///small.jpg",
      width: 640,
      height: 480,
    });

    expect(mockResize).not.toHaveBeenCalled();
    expect(mockRenderAsync).toHaveBeenCalledTimes(1);
  });

  test("rejects missing dimensions and missing base64 output", async () => {
    await expect(
      prepareImageForAnalysis({
        uri: "file:///bad.jpg",
        width: 0,
        height: 480,
      }),
    ).rejects.toThrow("image dimensions are required");

    mockPreparedImage({ renderedWidth: 640, renderedHeight: 480, base64: "" });

    await expect(
      prepareImageForAnalysis({
        uri: "file:///bad-output.jpg",
        width: 640,
        height: 480,
      }),
    ).rejects.toThrow("prepared image is missing base64 data");
  });
});
