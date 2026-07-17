import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { PreparedScanPhoto } from "../../src/domain/scan-machine";

type MockImagePickerResult =
  | {
      canceled: true;
      assets: null;
    }
  | {
      canceled: false;
      assets: Array<{
        uri: string;
        width: number;
        height: number;
      }>;
    };

const mockLaunchImageLibraryAsync = jest.fn<() => Promise<MockImagePickerResult>>();
const mockPrepareImageForAnalysis = jest.fn<() => Promise<PreparedScanPhoto>>();
const mockBack = jest.fn();

jest.mock("expo-image-picker", () => ({
  __esModule: true,
  launchImageLibraryAsync: mockLaunchImageLibraryAsync,
}));

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
}));

jest.mock("../../src/services/prepare-image", () => ({
  prepareImageForAnalysis: mockPrepareImageForAnalysis,
}));

const { default: ScanScreen } = require("../../app/scan") as typeof import("../../app/scan");

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("ScanScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns to acquisition without an error when Photos is cancelled", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    });

    await render(<ScanScreen />);
    await fireEvent.press(screen.getByLabelText("Choose from Photos"));

    expect(screen.getByText("Scan your meal")).toBeTruthy();
    expect(screen.getByLabelText("Choose from Photos")).toBeTruthy();
    expect(screen.queryByText("Could not prepare that photo.")).toBeNull();
    expect(mockPrepareImageForAnalysis).not.toHaveBeenCalled();
  });

  test("keeps the selected photo visible while preparation advances to analyzing", async () => {
    const preparation = createDeferred<Awaited<ReturnType<typeof mockPrepareImageForAnalysis>>>();
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected.jpg",
          width: 3024,
          height: 4032,
        },
      ],
    });
    mockPrepareImageForAnalysis.mockReturnValue(preparation.promise);

    await render(<ScanScreen />);
    fireEvent.press(screen.getByLabelText("Choose from Photos"));

    await waitFor(() => {
      expect(screen.getByLabelText("Selected meal photo").props.source).toEqual({
        uri: "file:///selected.jpg",
      });
    });
    expect(screen.getByText("Preparing photo")).toBeTruthy();
    expect(mockPrepareImageForAnalysis).toHaveBeenCalledWith({
      uri: "file:///selected.jpg",
      width: 3024,
      height: 4032,
    });

    preparation.resolve({
      uri: "file:///prepared.jpg",
      base64: "prepared-base64",
      width: 768,
      height: 1024,
    });

    await waitFor(() => {
      expect(screen.getByText("Analyzing estimate")).toBeTruthy();
    });
    expect(screen.getByLabelText("Selected meal photo").props.source).toEqual({
      uri: "file:///prepared.jpg",
    });
  });
});
