import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { PreparedScanPhoto } from "../../src/domain/scan-machine";
import type { AnalyzePreparedPhotoResult } from "../../src/services/analyze-photo";
import { DayProvider } from "../../src/state/day-context";

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

type AnalyzeOptions = {
  signal?: AbortSignal;
};

const mockLaunchImageLibraryAsync = jest.fn<() => Promise<MockImagePickerResult>>();
const mockPrepareImageForAnalysis = jest.fn<
  () => Promise<PreparedScanPhoto>
>();
const mockAnalyzePreparedPhoto = jest.fn<
  (photo: PreparedScanPhoto, options?: AnalyzeOptions) => Promise<AnalyzePreparedPhotoResult>
>();
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
const { AnalyzePhotoError } = require("../../src/services/analyze-photo") as {
  AnalyzePhotoError: new (reason: "analysis" | "network") => Error;
};

function preparedPhoto(uri: string): PreparedScanPhoto {
  return {
    uri,
    base64: `${uri}-base64`,
    width: 1024,
    height: 768,
  };
}

function selectedImage(uri: string): MockImagePickerResult {
  return {
    canceled: false,
    assets: [
      {
        uri,
        width: 3024,
        height: 2268,
      },
    ],
  };
}

function foodAnalysis(food = "recovery bowl"): AnalyzePreparedPhotoResult {
  return {
    type: "food",
    result: {
      food,
      calories: 610,
      protein_g: 36,
      carbs_g: 72,
      fat_g: 18,
      confidence: 0.87,
    },
  };
}

async function chooseFromPhotos() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText("Choose from Photos"));
  });
}

describe("ScanScreen recoverable errors", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("recovers from not-food by choosing another photo", async () => {
    const notFoodPhoto = preparedPhoto("file:///prepared-empty.jpg");
    const foodPhoto = preparedPhoto("file:///prepared-food.jpg");

    mockLaunchImageLibraryAsync
      .mockResolvedValueOnce(selectedImage("file:///empty.jpg"))
      .mockResolvedValueOnce(selectedImage("file:///food.jpg"));
    mockPrepareImageForAnalysis.mockResolvedValueOnce(notFoodPhoto).mockResolvedValueOnce(foodPhoto);
    mockAnalyzePreparedPhoto
      .mockResolvedValueOnce({ type: "not_food" })
      .mockResolvedValueOnce(foodAnalysis("salmon bowl"));

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );

    await chooseFromPhotos();

    await waitFor(() => {
      expect(screen.getByText("No food found")).toBeTruthy();
    });
    expect(screen.getByLabelText("Try another photo")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Try another photo"));
    });
    await chooseFromPhotos();

    await waitFor(() => {
      expect(screen.getByText("Estimated result")).toBeTruthy();
    });
    expect(screen.getByText("salmon bowl")).toBeTruthy();
    expect(mockAnalyzePreparedPhoto).toHaveBeenLastCalledWith(
      foodPhoto,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("retries a network failure with the same prepared image", async () => {
    const photo = preparedPhoto("file:///prepared-network.jpg");

    mockLaunchImageLibraryAsync.mockResolvedValue(selectedImage("file:///network.jpg"));
    mockPrepareImageForAnalysis.mockResolvedValue(photo);
    mockAnalyzePreparedPhoto
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(foodAnalysis("retry bowl"));

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );

    await chooseFromPhotos();

    await waitFor(() => {
      expect(screen.getByText("Connection problem")).toBeTruthy();
    });
    expect(screen.getByLabelText("Retry analysis")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Retry analysis"));
    });

    await waitFor(() => {
      expect(screen.getByText("retry bowl")).toBeTruthy();
    });
    expect(mockPrepareImageForAnalysis).toHaveBeenCalledTimes(1);
    expect(mockAnalyzePreparedPhoto).toHaveBeenCalledTimes(2);
    expect(mockAnalyzePreparedPhoto).toHaveBeenNthCalledWith(
      2,
      photo,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("retries a safe analysis failure with the same prepared image", async () => {
    const photo = preparedPhoto("file:///prepared-safe-502.jpg");

    mockLaunchImageLibraryAsync.mockResolvedValue(selectedImage("file:///safe-502.jpg"));
    mockPrepareImageForAnalysis.mockResolvedValue(photo);
    mockAnalyzePreparedPhoto
      .mockRejectedValueOnce(new AnalyzePhotoError("analysis"))
      .mockResolvedValueOnce(foodAnalysis("recovered stew"));

    await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );

    await chooseFromPhotos();

    await waitFor(() => {
      expect(screen.getByText("Could not analyze photo")).toBeTruthy();
    });
    expect(screen.getByLabelText("Retry analysis")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Retry analysis"));
    });

    await waitFor(() => {
      expect(screen.getByText("recovered stew")).toBeTruthy();
    });
    expect(mockPrepareImageForAnalysis).toHaveBeenCalledTimes(1);
    expect(mockAnalyzePreparedPhoto).toHaveBeenNthCalledWith(
      2,
      photo,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("aborts active analysis on unmount and ignores the late result", async () => {
    const photo = preparedPhoto("file:///prepared-pending.jpg");
    let resolveAnalysis: (value: AnalyzePreparedPhotoResult) => void = () => undefined;
    const analysis = new Promise<AnalyzePreparedPhotoResult>((resolve) => {
      resolveAnalysis = resolve;
    });

    mockLaunchImageLibraryAsync.mockResolvedValue(selectedImage("file:///pending.jpg"));
    mockPrepareImageForAnalysis.mockResolvedValue(photo);
    mockAnalyzePreparedPhoto.mockReturnValue(analysis);

    const result = await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );

    await chooseFromPhotos();

    await waitFor(() => {
      expect(screen.getByText("Analyzing estimate")).toBeTruthy();
    });

    const signal = mockAnalyzePreparedPhoto.mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(false);

    await act(async () => {
      result.unmount();
    });
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      resolveAnalysis(foodAnalysis("late bowl"));
    });
  });
});
