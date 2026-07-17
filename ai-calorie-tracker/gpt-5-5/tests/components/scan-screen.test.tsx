import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { PreparedScanPhoto } from "../../src/domain/scan-machine";
import { DayProvider } from "../../src/state/day-context";
import type { AnalyzePreparedPhotoResult } from "../../src/services/analyze-photo";

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
const mockAnalyzePreparedPhoto = jest.fn<() => Promise<AnalyzePreparedPhotoResult>>();
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

jest.mock("../../src/services/analyze-photo", () => ({
  AnalyzePhotoError: class AnalyzePhotoError extends Error {
    readonly reason: "analysis" | "network";

    constructor(reason: "analysis" | "network") {
      super(reason);
      this.reason = reason;
    }
  },
  analyzePreparedPhoto: mockAnalyzePreparedPhoto,
}));

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
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
    mockAnalyzePreparedPhoto.mockReturnValue(new Promise(() => undefined));
  });

  test("returns to acquisition without an error when Photos is cancelled", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    });

    await renderScanScreen();
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

    await renderScanScreen();
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

async function renderScanScreen() {
  await render(
    <DayProvider>
      <ScanScreen />
    </DayProvider>,
  );
}
