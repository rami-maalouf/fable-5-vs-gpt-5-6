import { act, fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { ScanScreen } from "../../app/scan";
import { ScanPhotoStage } from "../../src/components/scan/ScanPhotoStage";
import type { ScanSuccess } from "../../src/domain/scan-contract";
import type { PreparedPhoto } from "../../src/domain/scan-machine";
import { analyzePhoto } from "../../src/services/analyze-photo";
import {
  pickLibraryImage,
  prepareImage,
} from "../../src/services/prepare-image";
import { DayProvider } from "../../src/state/day-context";

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
}));

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [
    {
      canAskAgain: true,
      expires: "never",
      granted: true,
      status: "granted",
    },
    jest.fn(),
  ],
}));

jest.mock("../../src/services/analyze-photo", () => ({
  AnalyzePhotoError: class AnalyzePhotoError extends Error {},
  analyzePhoto: jest.fn(),
}));

jest.mock("../../src/services/prepare-image", () => ({
  pickLibraryImage: jest.fn(),
  prepareImage: jest.fn(),
}));

jest.mock("../../src/services/widget", () => ({
  updateRemainingCaloriesWidget: jest.fn(),
}));

const preparedPhoto: PreparedPhoto = {
  uri: "file:///prepared-copy.jpg",
  base64: "prepared-base64",
  width: 1_024,
  height: 768,
};

const result: ScanSuccess = {
  food: "Salmon pasta",
  calories: 850,
  protein_g: 64.8,
  carbs_g: 101.6,
  fat_g: 42.5,
  confidence: 0.9,
};

describe("scan photo continuity", () => {
  it("keeps one image instance while handing off to the prepared photo", async () => {
    const screen = await render(
      <ScanPhotoStage photoUri="file:///selected-source.jpg">
        <Text>Preparing your photo</Text>
      </ScanPhotoStage>,
    );

    const photo = screen.getByTestId("prepared-meal-photo", {
      includeHiddenElements: true,
    });

    await screen.rerender(
      <ScanPhotoStage photoUri="file:///prepared-copy.jpg">
        <Text>Analyzing your meal</Text>
      </ScanPhotoStage>,
    );

    expect(
      screen.getByTestId("prepared-meal-photo", {
        includeHiddenElements: true,
      }),
    ).toBe(photo);
    expect(photo).toHaveProp("source", [{ uri: "file:///prepared-copy.jpg" }]);
    expect(screen.getByText("Analyzing your meal")).toBeOnTheScreen();
  });

  it("keeps the image mounted through deferred preparation and analysis", async () => {
    let finishPreparation: ((photo: PreparedPhoto) => void) | undefined;
    let finishAnalysis: ((analysis: ScanSuccess) => void) | undefined;
    jest.mocked(pickLibraryImage).mockResolvedValue({
      uri: "file:///selected-source.jpg",
      width: 3_024,
      height: 4_032,
    });
    jest.mocked(prepareImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishPreparation = resolve;
        }),
    );
    jest.mocked(analyzePhoto).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishAnalysis = resolve;
        }),
    );

    const screen = await render(
      <DayProvider>
        <ScanScreen />
      </DayProvider>,
    );
    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Choose from Photos" }),
      );
    });

    expect(await screen.findByText("Preparing your photo")).toBeOnTheScreen();
    const photo = screen.getByTestId("prepared-meal-photo", {
      includeHiddenElements: true,
    });
    expect(photo).toHaveProp("source", [
      { uri: "file:///selected-source.jpg" },
    ]);

    await act(async () => {
      finishPreparation?.(preparedPhoto);
      await Promise.resolve();
    });

    expect(await screen.findByText("Analyzing your meal")).toBeOnTheScreen();
    expect(
      screen.getByTestId("prepared-meal-photo", {
        includeHiddenElements: true,
      }),
    ).toBe(photo);
    expect(photo).toHaveProp("source", [{ uri: preparedPhoto.uri }]);

    await act(async () => {
      finishAnalysis?.(result);
      await Promise.resolve();
    });

    expect(await screen.findByText("Salmon pasta")).toBeOnTheScreen();
    expect(
      screen.getByTestId("prepared-meal-photo", {
        includeHiddenElements: true,
      }),
    ).toBe(photo);
    expect(photo).toHaveProp("source", [{ uri: preparedPhoto.uri }]);
  });
});
