import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";
import { StrictMode } from "react";
import { Text } from "react-native";

import { ScanScreen } from "../../app/scan";
import { ErrorCard } from "../../src/components/scan/ErrorCard";
import type { ScanSuccess } from "../../src/domain/scan-contract";
import type { PreparedPhoto, ScanState } from "../../src/domain/scan-machine";
import { analyzePhoto } from "../../src/services/analyze-photo";
import {
  pickLibraryImage,
  prepareImage,
} from "../../src/services/prepare-image";
import { DayProvider, useDay } from "../../src/state/day-context";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("../../src/components/scan/ErrorCard", () => {
  const React = jest.requireActual("react");
  const actual = jest.requireActual("../../src/components/scan/ErrorCard");

  return {
    ErrorCard: (props: {
      kind: "not-food" | "network" | "analysis";
      onDiscard: () => void;
      onRetryAnalysis: () => void;
      onTryAnother: () => void;
    }) =>
      React.createElement(actual.ErrorCard, {
        ...props,
        onRetryAnalysis: () => {
          props.onRetryAnalysis();
          props.onRetryAnalysis();
        },
      }),
  };
});

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
  uri: "file:///prepared-original.jpg",
  base64: "prepared-original-base64",
  width: 1_024,
  height: 768,
};

const replacementPhoto: PreparedPhoto = {
  uri: "file:///prepared-replacement.jpg",
  base64: "prepared-replacement-base64",
  width: 768,
  height: 1_024,
};

const success: ScanSuccess = {
  food: "Chicken rice bowl",
  calories: 720,
  protein_g: 54,
  carbs_g: 78,
  fat_g: 23,
  confidence: 0.93,
};

function errorState(kind: "not-food" | "network" | "analysis"): ScanState {
  return {
    status: "error",
    kind,
    requestId: "request-original",
    photo: preparedPhoto,
  };
}

function DayObserver() {
  const { meals } = useDay();
  return <Text testID="meal-count">{meals.length}</Text>;
}

function renderScan(initialState: ScanState, strict = false) {
  const scan = (
    <DayProvider>
      <ScanScreen initialState={initialState} />
      <DayObserver />
    </DayProvider>
  );

  return render(strict ? <StrictMode>{scan}</StrictMode> : scan);
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("scan recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(pickLibraryImage).mockResolvedValue({
      uri: "file:///replacement-source.jpg",
      width: 3_024,
      height: 4_032,
    });
    jest.mocked(prepareImage).mockResolvedValue(replacementPhoto);
    jest.mocked(analyzePhoto).mockResolvedValue(success);
  });

  it.each([
    {
      kind: "not-food" as const,
      title: "We couldn't find food",
      action: "Try another photo",
    },
    {
      kind: "network" as const,
      title: "Connection interrupted",
      action: "Retry analysis",
    },
    {
      kind: "analysis" as const,
      title: "Analysis unavailable",
      action: "Retry analysis",
    },
  ])(
    "renders distinct $kind recovery copy and actions",
    async ({ kind, title, action }) => {
      await render(
        <ErrorCard
          kind={kind}
          onDiscard={jest.fn()}
          onRetryAnalysis={jest.fn()}
          onTryAnother={jest.fn()}
        />,
      );

      expect(screen.getByText(title)).toBeOnTheScreen();
      expect(screen.getByRole("button", { name: action })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Discard" })).toBeEnabled();
    },
  );

  it("recovers from not-food by selecting and analyzing a new photo", async () => {
    await renderScan(errorState("not-food"));
    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Try another photo" }),
      );
    });
    expect(
      screen.getByRole("button", { name: "Choose from Photos" }),
    ).toBeEnabled();

    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Choose from Photos" }),
      );
      await flushAsyncWork();
    });

    expect(await screen.findByText("Chicken rice bowl")).toBeOnTheScreen();
    expect(analyzePhoto).toHaveBeenCalledWith(
      replacementPhoto.base64,
      expect.any(AbortSignal),
    );
    expect(
      screen.getByTestId("prepared-meal-photo", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("source", [{ uri: replacementPhoto.uri }]);
  });

  it("continues preparation after Strict Mode replays the mount effect", async () => {
    await renderScan({ status: "acquiring", source: "library" }, true);

    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Choose from Photos" }),
      );
      await flushAsyncWork();
    });

    expect(await screen.findByText("Chicken rice bowl")).toBeOnTheScreen();
    expect(analyzePhoto).toHaveBeenCalledWith(
      replacementPhoto.base64,
      expect.any(AbortSignal),
    );
  });

  it.each(["network", "analysis"] as const)(
    "retries a %s failure against the exact same prepared photo",
    async (kind) => {
      await renderScan(errorState(kind));

      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Retry analysis" }));
        await flushAsyncWork();
      });

      expect(await screen.findByText("Chicken rice bowl")).toBeOnTheScreen();
      expect(analyzePhoto).toHaveBeenCalledTimes(1);
      expect(analyzePhoto).toHaveBeenCalledWith(
        preparedPhoto.base64,
        expect.any(AbortSignal),
      );
      expect(
        screen.getByTestId("prepared-meal-photo", {
          includeHiddenElements: true,
        }),
      ).toHaveProp("source", [{ uri: preparedPhoto.uri }]);
    },
  );

  it("aborts an active retry on discard and ignores its late completion", async () => {
    let resolveAnalysis: ((value: ScanSuccess) => void) | undefined;
    jest.mocked(analyzePhoto).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        }),
    );
    await renderScan(errorState("network"));
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Retry analysis" }));
    });
    await screen.findByText("Analyzing your meal");
    const signal = jest.mocked(analyzePhoto).mock.calls[0][1];

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Close scanner" }));
    });

    expect(signal?.aborted).toBe(true);
    expect(router.back).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveAnalysis?.(success);
      await flushAsyncWork();
    });
    expect(screen.queryByText("Chicken rice bowl")).not.toBeOnTheScreen();
    expect(screen.getByTestId("meal-count")).toHaveTextContent("0");
  });

  it("aborts active analysis when the screen unmounts", async () => {
    jest.mocked(analyzePhoto).mockImplementation(() => new Promise(() => {}));
    const view = await renderScan(errorState("analysis"));
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Retry analysis" }));
    });
    await screen.findByText("Analyzing your meal");
    const signal = jest.mocked(analyzePhoto).mock.calls[0][1];

    await act(async () => {
      view.unmount();
    });

    expect(signal?.aborted).toBe(true);
  });

  it("starts only one request when retry is pressed rapidly", async () => {
    let resolveAnalysis: ((value: ScanSuccess) => void) | undefined;
    jest.mocked(analyzePhoto).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        }),
    );
    await renderScan(errorState("network"));
    const retry = screen.getByRole("button", { name: "Retry analysis" });

    await act(async () => {
      fireEvent.press(retry);
    });

    expect(analyzePhoto).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveAnalysis?.(success);
      await flushAsyncWork();
    });
    expect(await screen.findByText("Chicken rice bowl")).toBeOnTheScreen();
  });
});
