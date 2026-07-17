import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native';

import { ScanScreen } from '../../app/scan';
import { CameraCaptureView } from '../../src/components/scan/CameraView';
import { analyzePhoto } from '../../src/services/analyze-photo';
import { pickLibraryImage, prepareImage } from '../../src/services/prepare-image';
import { DayProvider } from '../../src/state/day-context';

const mockTakePictureAsync = jest.fn();
const mockRequestCameraPermission = jest.fn();
let mockCameraPermission = {
  canAskAgain: true,
  expires: 'never',
  granted: true,
  status: 'granted',
};

jest.mock('expo-camera', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    CameraView: React.forwardRef(
      (
        props: Record<string, unknown>,
        ref: { current: unknown } | ((value: unknown) => void) | null,
      ) => {
        React.useImperativeHandle(ref, () => ({
          takePictureAsync: mockTakePictureAsync,
        }));
        return React.createElement(View, {
          ...props,
          testID: 'expo-camera-view',
        });
      },
    ),
    useCameraPermissions: () => [
      mockCameraPermission,
      mockRequestCameraPermission,
    ],
  };
});

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock('../../src/services/widget', () => ({
  updateRemainingCaloriesWidget: jest.fn(),
}));

jest.mock('../../src/services/analyze-photo', () => ({
  AnalyzePhotoError: class AnalyzePhotoError extends Error {},
  analyzePhoto: jest.fn(),
}));

jest.mock('../../src/services/prepare-image', () => ({
  pickLibraryImage: jest.fn(),
  prepareImage: jest.fn(),
}));

function renderScanner() {
  return render(
    <DayProvider>
      <ScanScreen />
    </DayProvider>,
  );
}

describe('camera acquisition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermission = {
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted',
    };
    mockRequestCameraPermission.mockResolvedValue(mockCameraPermission);
    jest.mocked(pickLibraryImage).mockResolvedValue({
      uri: 'file:///library-source.jpg',
      width: 1_600,
      height: 1_200,
    });
    jest.mocked(prepareImage).mockResolvedValue({
      uri: 'file:///prepared.jpg',
      base64: 'prepared-base64',
      width: 1_024,
      height: 768,
    });
    jest.mocked(analyzePhoto).mockResolvedValue({
      food: 'Camera meal',
      calories: 640,
      protein_g: 42,
      carbs_g: 70,
      fat_g: 21,
      confidence: 0.91,
    });
  });

  it('renders a rear full-screen preview with safe, reachable controls', async () => {
    await render(
      <CameraCaptureView
        onCapture={jest.fn()}
        onClose={jest.fn()}
        onPhotos={jest.fn()}
        onUnavailable={jest.fn()}
      />,
    );

    const preview = screen.getByTestId('expo-camera-view');
    expect(preview).toHaveProp('facing', 'back');
    expect(StyleSheet.flatten(preview.props.style).flex).toBe(1);
    expect(screen.getByRole('button', { name: 'Close camera' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Choose from Photos' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Take meal photo' })).toBeDisabled();

    await act(async () => {
      preview.props.onCameraReady();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Take meal photo' })).toBeEnabled();
    });
  });

  it('locks the shutter so one gesture can produce at most one photo', async () => {
    let resolvePicture: ((picture: {
      uri: string;
      width: number;
      height: number;
    }) => void) | undefined;
    mockTakePictureAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicture = resolve;
        }),
    );
    const onCapture = jest.fn();
    await render(
      <CameraCaptureView
        onCapture={onCapture}
        onClose={jest.fn()}
        onPhotos={jest.fn()}
        onUnavailable={jest.fn()}
      />,
    );
    await act(async () => {
      screen.getByTestId('expo-camera-view').props.onCameraReady();
    });

    const shutter = screen.getByRole('button', { name: 'Take meal photo' });
    fireEvent.press(shutter);

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium,
      );
      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Take meal photo' })).toBeDisabled();
    });
    fireEvent.press(shutter);
    expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolvePicture?.({
        uri: 'file:///captured.jpg',
        width: 4_032,
        height: 3_024,
      });
    });
    expect(onCapture).toHaveBeenCalledWith({
      uri: 'file:///captured.jpg',
      width: 4_032,
      height: 3_024,
    });
  });

  it('keeps Photos and close available after camera permission is denied', async () => {
    mockCameraPermission = {
      canAskAgain: false,
      expires: 'never',
      granted: false,
      status: 'denied',
    };
    mockRequestCameraPermission.mockResolvedValue(mockCameraPermission);
    await renderScanner();

    fireEvent.press(screen.getByRole('button', { name: 'Use camera' }));

    expect(await screen.findByText(/camera access is off/i)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Choose from Photos' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Close scanner' })).toBeEnabled();
  });

  it('returns to a recoverable acquisition screen when the camera is unavailable', async () => {
    await renderScanner();
    fireEvent.press(screen.getByRole('button', { name: 'Use camera' }));
    const preview = await screen.findByTestId('expo-camera-view');

    fireEvent(preview, 'mountError', { message: 'camera unavailable' });

    expect(await screen.findByText(/camera is unavailable/i)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Choose from Photos' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Close scanner' })).toBeEnabled();
  });

  it('routes a capture through the shared JPEG preparation and analysis pipeline', async () => {
    mockTakePictureAsync.mockResolvedValue({
      uri: 'file:///camera-source.jpg',
      width: 4_032,
      height: 3_024,
    });
    await renderScanner();
    fireEvent.press(screen.getByRole('button', { name: 'Use camera' }));
    const preview = await screen.findByTestId('expo-camera-view');
    await act(async () => {
      preview.props.onCameraReady();
    });

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Take meal photo' }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(await screen.findByText('AI ESTIMATE')).toBeOnTheScreen();
    expect(prepareImage).toHaveBeenCalledTimes(1);
    expect(prepareImage).toHaveBeenCalledWith({
      uri: 'file:///camera-source.jpg',
      width: 4_032,
      height: 3_024,
    });
    expect(analyzePhoto).toHaveBeenCalledWith(
      'prepared-base64',
      expect.any(AbortSignal),
    );
  });
});
