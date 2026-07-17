import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

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

describe("ScanScreen result state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the validated analysis result above the unchanged prepared photo", async () => {
    const preparedPhoto: PreparedScanPhoto = {
      uri: "file:///prepared.jpg",
      base64: "prepared-base64",
      width: 1024,
      height: 768,
    };
    const analysis = createDeferred<AnalyzePreparedPhotoResult>();
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected.jpg",
          width: 3024,
          height: 2268,
        },
      ],
    });
    mockPrepareImageForAnalysis.mockResolvedValue(preparedPhoto);
    mockAnalyzePreparedPhoto.mockReturnValue(analysis.promise);

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Choose from Photos"));
    });

    await waitFor(() => {
      expect(screen.getByText("Analyzing estimate")).toBeTruthy();
    });
    expect(mockAnalyzePreparedPhoto).toHaveBeenCalledWith(
      preparedPhoto,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    analysis.resolve({
      type: "food",
      result: {
        food: "salmon rice bowl",
        calories: 720,
        protein_g: 42,
        carbs_g: 83,
        fat_g: 24,
        confidence: 0.91,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Estimated result")).toBeTruthy();
    });
    expect(screen.getByLabelText("Selected meal photo").props.source).toEqual({
      uri: "file:///prepared.jpg",
    });
    expect(screen.getByText("salmon rice bowl")).toBeTruthy();
    expect(screen.getByText("720 cal")).toBeTruthy();
    expect(screen.getByText("42g protein")).toBeTruthy();
    expect(screen.getByText("83g carbs")).toBeTruthy();
    expect(screen.getByText("24g fat")).toBeTruthy();
    expect(screen.getByText("91% confidence")).toBeTruthy();
    expect(screen.getByLabelText("Accept food estimate")).toBeTruthy();
    expect(screen.getByLabelText("Discard food estimate")).toBeTruthy();
  });

  test("renders a recoverable not-food result above the prepared photo", async () => {
    const preparedPhoto: PreparedScanPhoto = {
      uri: "file:///prepared-empty.jpg",
      base64: "prepared-base64",
      width: 1024,
      height: 768,
    };
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected.jpg",
          width: 3024,
          height: 2268,
        },
      ],
    });
    mockPrepareImageForAnalysis.mockResolvedValue(preparedPhoto);
    mockAnalyzePreparedPhoto.mockResolvedValue({
      type: "not_food",
    });

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Choose from Photos"));
    });

    await waitFor(() => {
      expect(screen.getByText("No food found")).toBeTruthy();
    });
    expect(screen.getByLabelText("Selected meal photo").props.source).toEqual({
      uri: "file:///prepared-empty.jpg",
    });
    expect(screen.getByLabelText("Try another photo")).toBeTruthy();
    expect(screen.getAllByLabelText("Close scan").length).toBeGreaterThan(0);
  });

  test("renders a recoverable network error above the prepared photo", async () => {
    const preparedPhoto: PreparedScanPhoto = {
      uri: "file:///prepared-network.jpg",
      base64: "prepared-base64",
      width: 1024,
      height: 768,
    };
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected.jpg",
          width: 3024,
          height: 2268,
        },
      ],
    });
    mockPrepareImageForAnalysis.mockResolvedValue(preparedPhoto);
    mockAnalyzePreparedPhoto.mockRejectedValue(new Error("offline"));

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Choose from Photos"));
    });

    await waitFor(() => {
      expect(screen.getByText("Connection problem")).toBeTruthy();
    });
    expect(screen.getByLabelText("Selected meal photo").props.source).toEqual({
      uri: "file:///prepared-network.jpg",
    });
    expect(screen.getByLabelText("Try again")).toBeTruthy();
    expect(screen.getAllByLabelText("Close scan").length).toBeGreaterThan(0);
  });
});
