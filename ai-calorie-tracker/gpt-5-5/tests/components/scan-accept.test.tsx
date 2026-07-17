import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { PreparedScanPhoto } from "../../src/domain/scan-machine";
import type { AnalyzePreparedPhotoResult } from "../../src/services/analyze-photo";

type MockImagePickerResult = {
  canceled: false;
  assets: Array<{
    uri: string;
    width: number;
    height: number;
  }>;
};

const preparedPhoto: PreparedScanPhoto = {
  uri: "file:///prepared-fried-chicken.jpg",
  base64: "prepared-base64",
  width: 1024,
  height: 768,
};

const foodAnalysis: AnalyzePreparedPhotoResult = {
  type: "food",
  result: {
    food: "fried chicken",
    calories: 988,
    protein_g: 54,
    carbs_g: 39,
    fat_g: 60,
    confidence: 0.99,
  },
};

const mockLaunchImageLibraryAsync = jest.fn<() => Promise<MockImagePickerResult>>();
const mockPrepareImageForAnalysis = jest.fn<() => Promise<PreparedScanPhoto>>();
const mockAnalyzePreparedPhoto = jest.fn<() => Promise<AnalyzePreparedPhotoResult>>();
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-image-picker", () => ({
  __esModule: true,
  launchImageLibraryAsync: mockLaunchImageLibraryAsync,
}));

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
    push: mockPush,
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

const { default: HomeScreen } = require("../../app/(tabs)/index") as typeof import("../../app/(tabs)/index");
const { default: ScanScreen } = require("../../app/scan") as typeof import("../../app/scan");
const { DayProvider } = require("../../src/state/day-context") as typeof import("../../src/state/day-context");
const { publishRemainingCalories } = require("../../src/services/widget") as typeof import("../../src/services/widget");

async function renderScanWithDashboard() {
  await render(
    <DayProvider>
      <HomeScreen />
      <ScanScreen />
    </DayProvider>,
  );
}

async function selectPhotoAndWaitForResult() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText("Choose from Photos"));
  });

  await waitFor(() => {
    expect(screen.getByText("Estimated result")).toBeTruthy();
  });
}

describe("scan accept and discard integration", () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1234);
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
    mockAnalyzePreparedPhoto.mockResolvedValue(foodAnalysis);
  });

  test("accept logs a meal with the prepared thumbnail and publishes matching remaining calories", async () => {
    await renderScanWithDashboard();
    await selectPhotoAndWaitForResult();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Accept food estimate"));
    });

    await waitFor(() => {
      expect(screen.getByText("1 logged")).toBeTruthy();
    });
    expect(screen.getByText("fried chicken")).toBeTruthy();
    expect(screen.getByText("988 cal")).toBeTruthy();
    expect(screen.getByText("54p · 39c · 60f")).toBeTruthy();
    expect(screen.getByLabelText("fried chicken thumbnail").props.source).toEqual({
      uri: "file:///prepared-fried-chicken.jpg",
    });
    expect(screen.getByText("1012")).toBeTruthy();
    expect(publishRemainingCalories).toHaveBeenLastCalledWith(1012);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("discard closes the modal without changing meals or widget value", async () => {
    await renderScanWithDashboard();
    await selectPhotoAndWaitForResult();
    const widgetCallsBeforeDiscard = jest.mocked(publishRemainingCalories).mock.calls.length;

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Discard food estimate"));
    });

    expect(screen.getByText("No meals yet")).toBeTruthy();
    expect(screen.getByText("2000")).toBeTruthy();
    expect(publishRemainingCalories).toHaveBeenCalledTimes(widgetCallsBeforeDiscard);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
