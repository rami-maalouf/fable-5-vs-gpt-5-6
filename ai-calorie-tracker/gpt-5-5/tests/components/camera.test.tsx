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

type MockPermission = {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
  expires: "never";
};

const mockLaunchImageLibraryAsync = jest.fn<() => Promise<MockImagePickerResult>>();
const mockPrepareImageForAnalysis = jest.fn<(input: {
  uri: string;
  width: number;
  height: number;
}) => Promise<PreparedScanPhoto>>();
const mockAnalyzePreparedPhoto = jest.fn<() => Promise<AnalyzePreparedPhotoResult>>();
const mockBack = jest.fn();
const mockImpactAsync = jest.fn<() => Promise<void>>();
const mockTakePictureAsync = jest.fn<() => Promise<{
  uri: string;
  width: number;
  height: number;
  format: "jpg";
}>>();
const mockRequestCameraPermission = jest.fn<() => Promise<MockPermission>>();
let mockCameraPermission: MockPermission | null = null;
let mockCameraShouldMountError = false;

jest.mock("expo-camera", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");

  const MockCameraView = React.forwardRef(
    (
      props: {
        onMountError?: (error: { message: string }) => void;
      },
      ref,
    ) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: mockTakePictureAsync,
      }));

      React.useEffect(() => {
        if (mockCameraShouldMountError) {
          props.onMountError?.({ message: "camera unavailable" });
        }
      }, [props]);

      return React.createElement(View, {
        accessibilityLabel: "Rear camera preview",
      });
    },
  );

  return {
    __esModule: true,
    CameraView: MockCameraView,
    useCameraPermissions: () => [
      mockCameraPermission,
      mockRequestCameraPermission,
      jest.fn(),
    ],
  };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Medium: "medium",
  },
  impactAsync: mockImpactAsync,
}));

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
  analyzePreparedPhoto: mockAnalyzePreparedPhoto,
}));

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
}));

const { default: ScanScreen } = require("../../app/scan") as typeof import("../../app/scan");

describe("camera acquisition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraShouldMountError = false;
    mockCameraPermission = {
      granted: true,
      canAskAgain: true,
      status: "granted",
      expires: "never",
    };
    mockImpactAsync.mockResolvedValue(undefined);
    mockTakePictureAsync.mockResolvedValue({
      uri: "file:///camera.jpg",
      width: 4032,
      height: 3024,
      format: "jpg",
    });
    mockPrepareImageForAnalysis.mockResolvedValue({
      uri: "file:///prepared-camera.jpg",
      base64: "prepared-camera-base64",
      width: 1024,
      height: 768,
    });
    mockAnalyzePreparedPhoto.mockReturnValue(new Promise(() => undefined));
  });

  test("captures one granted camera photo through the shared preparation pipeline", async () => {
    await renderScanScreen();
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Use camera"));
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Rear camera preview")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Capture meal photo"));
    });

    await waitFor(() => {
      expect(mockPrepareImageForAnalysis).toHaveBeenCalledWith({
        uri: "file:///camera.jpg",
        width: 4032,
        height: 3024,
      });
    });

    expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    expect(mockImpactAsync).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("Analyzing estimate")).toBeTruthy();
    });
    expect(mockAnalyzePreparedPhoto).toHaveBeenCalledWith(
      {
        uri: "file:///prepared-camera.jpg",
        base64: "prepared-camera-base64",
        width: 1024,
        height: 768,
      },
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("keeps denied camera state recoverable through Photos or close", async () => {
    mockCameraPermission = {
      granted: false,
      canAskAgain: false,
      status: "denied",
      expires: "never",
    };
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///library.jpg",
          width: 3024,
          height: 4032,
        },
      ],
    });

    await renderScanScreen();
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Use camera"));
    });

    await waitFor(() => {
      expect(screen.getByText("Camera access is off")).toBeTruthy();
    });
    expect(screen.getByLabelText("Choose from Photos")).toBeTruthy();
    expect(screen.getByLabelText("Close scan")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Choose from Photos"));
    });

    await waitFor(() => {
      expect(mockPrepareImageForAnalysis).toHaveBeenCalledWith({
        uri: "file:///library.jpg",
        width: 3024,
        height: 4032,
      });
    });
  });

  test("keeps unavailable camera state recoverable through Photos or close", async () => {
    mockCameraShouldMountError = true;

    await renderScanScreen();
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Use camera"));
    });

    await waitFor(() => {
      expect(screen.getByText("Camera unavailable")).toBeTruthy();
    });

    expect(screen.getByLabelText("Choose from Photos")).toBeTruthy();
    expect(screen.getByLabelText("Close scan")).toBeTruthy();
    expect(screen.queryByLabelText("Capture meal photo")).toBeNull();
  });
});

async function renderScanScreen() {
  await render(
    <DayProvider>
      <ScanScreen />
    </DayProvider>,
  );
}
