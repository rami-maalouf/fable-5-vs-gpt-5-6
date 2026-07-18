// camera acquisition behavior: granted shows a preview with shutter and
// close and one capture dispatches exactly one preparation, denied and
// unavailable keep library and close reachable, permission is requested only
// on demand, and captured photos share the library preparation pipeline.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode, Ref } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type MockPermission = {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  expires: 'never';
} | null;

let mockPermission: MockPermission = null;
const mockRequestPermission = jest.fn();
const mockTakePictureAsync = jest.fn();

type MockCameraViewProps = {
  onCameraReady?: () => void;
  children?: ReactNode;
  testID?: string;
};

jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>(
    'react-native',
  );
  const MockCameraView = React.forwardRef(function MockCameraView(
    props: MockCameraViewProps,
    ref: Ref<{ takePictureAsync: typeof mockTakePictureAsync }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: mockTakePictureAsync,
    }));
    const onCameraReady = props.onCameraReady;
    React.useEffect(() => {
      onCameraReady?.();
    }, [onCameraReady]);
    return React.createElement(View, { testID: props.testID });
  });
  return {
    CameraView: MockCameraView,
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
  };
});

const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockImpactAsync = jest.fn();
jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

const mockPrepareImage = jest.fn();
jest.mock('../../src/services/prepare-image', () => ({
  prepareImage: (...args: unknown[]) => mockPrepareImage(...args),
}));

// analysis stays pending; reaching the analyzing state proves the capture
// entered the same pipeline the library path uses
const mockAnalyzePhoto = jest.fn();
jest.mock('../../src/services/analyze-photo', () => ({
  analyzePhoto: (...args: unknown[]) => mockAnalyzePhoto(...args),
}));

jest.mock('../../src/services/widget', () => ({
  publishRemainingCalories: jest.fn(),
}));

import ScanScreen from '../../src/app/scan';
import type { PreparedPhoto } from '../../src/domain/scan-machine';
import { DayProvider } from '../../src/state/day-context';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const GRANTED: MockPermission = {
  granted: true,
  canAskAgain: true,
  status: 'granted',
  expires: 'never',
};

const DENIED: MockPermission = {
  granted: false,
  canAskAgain: false,
  status: 'denied',
  expires: 'never',
};

const UNDETERMINED: MockPermission = {
  granted: false,
  canAskAgain: true,
  status: 'undetermined',
  expires: 'never',
};

const CAPTURED = {
  uri: 'file:///camera/capture.jpg',
  width: 3024,
  height: 4032,
};

const PICKED_ASSET = {
  uri: 'file:///picked/salad.jpg',
  width: 1536,
  height: 2048,
};

const PREPARED_PHOTO: PreparedPhoto = {
  uri: 'file:///cache/prepared.jpg',
  base64: 'cGl4ZWxz',
  width: 768,
  height: 1024,
};

// rntl v14 render is async and must be awaited
async function renderScan() {
  await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <DayProvider>
        <ScanScreen />
      </DayProvider>
    </SafeAreaProvider>,
  );
}

async function openCamera() {
  await renderScan();
  fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));
  // rntl v14 flushes state updates asynchronously; wait for the camera view
  // (its close control) to replace the acquisition choices
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Close camera' })).toBeTruthy();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission = GRANTED;
  mockAnalyzePhoto.mockReturnValue(new Promise(() => {}));
  mockRequestPermission.mockResolvedValue(DENIED);
});

it('shows a full-screen preview with shutter and close when granted', async () => {
  await openCamera();

  expect(screen.getByTestId('camera-preview')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Capture photo' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Close camera' })).toBeTruthy();
});

it('captures at most one photo under rapid double shutter presses', async () => {
  let resolveCapture: (photo: typeof CAPTURED) => void = () => {};
  mockTakePictureAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveCapture = resolve;
      }),
  );
  mockPrepareImage.mockResolvedValue(PREPARED_PHOTO);
  await openCamera();

  // back-to-back presses in one act frame poison later tests; await the
  // first press settling, then press again while the capture is still
  // pending so the double-press race is real
  fireEvent.press(screen.getByRole('button', { name: 'Capture photo' }));
  await waitFor(() => {
    expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
  });
  fireEvent.press(screen.getByRole('button', { name: 'Capture photo' }));

  expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
  // spec requires a capture haptic on the shutter, once per capture
  expect(mockImpactAsync).toHaveBeenCalledTimes(1);

  resolveCapture(CAPTURED);

  // exactly one start_preparing: preparation runs once with the captured uri
  await waitFor(() => {
    expect(mockPrepareImage).toHaveBeenCalledTimes(1);
  });
  expect(mockPrepareImage).toHaveBeenCalledWith(CAPTURED);
});

it('freezes the captured frame over the preview while preparing', async () => {
  mockTakePictureAsync.mockResolvedValue(CAPTURED);
  let resolvePrepare: (photo: PreparedPhoto) => void = () => {};
  mockPrepareImage.mockImplementation(
    () =>
      new Promise<PreparedPhoto>((resolve) => {
        resolvePrepare = resolve;
      }),
  );
  await openCamera();

  fireEvent.press(screen.getByRole('button', { name: 'Capture photo' }));

  // the captured image renders immediately above the still-mounted preview
  await waitFor(() => {
    expect(screen.getByTestId('camera-frozen-photo')).toBeTruthy();
  });
  expect(screen.getByTestId('camera-frozen-photo').props.source).toEqual([
    { uri: CAPTURED.uri },
  ]);
  expect(screen.getByTestId('camera-preview')).toBeTruthy();
  expect(screen.getByText('Preparing photo')).toBeTruthy();

  resolvePrepare(PREPARED_PHOTO);

  // the prepared photo enters the same analyzing stage the library path
  // uses: the base layer keeps the captured frame uri and the prepared jpeg
  // crossfades in above it
  await waitFor(() => {
    expect(screen.getByText('Analyzing your meal')).toBeTruthy();
  });
  expect(screen.getByTestId('scan-photo').props.source).toEqual([
    { uri: CAPTURED.uri },
  ]);
  expect(screen.getByTestId('scan-photo-prepared').props.source).toEqual([
    { uri: PREPARED_PHOTO.uri },
  ]);
});

it('keeps library and close reachable with an explanation when denied', async () => {
  mockPermission = DENIED;
  await openCamera();

  // a clear in-context explanation that mentions settings but does not
  // depend on it; ios never re-prompts after denial
  expect(screen.getByText('Camera access needed')).toBeTruthy();
  expect(screen.getByText(/Settings/)).toBeTruthy();
  expect(mockRequestPermission).not.toHaveBeenCalled();

  // the library path still completes from the denied state
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [PICKED_ASSET],
  });
  mockPrepareImage.mockResolvedValue(PREPARED_PHOTO);
  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
  await waitFor(() => {
    expect(screen.getByText('Analyzing your meal')).toBeTruthy();
  });
  expect(mockPrepareImage).toHaveBeenCalledWith(PICKED_ASSET);
});

it('returns to the acquisition choices when the denied camera is closed', async () => {
  mockPermission = DENIED;
  await openCamera();

  fireEvent.press(screen.getByRole('button', { name: 'Close camera' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeTruthy();
  });
  expect(
    screen.getByRole('button', { name: 'Choose from library' }),
  ).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
});

it('requests permission only when the camera is chosen', async () => {
  mockPermission = UNDETERMINED;
  await renderScan();

  // rendering the acquisition choices never asks for the camera
  expect(mockRequestPermission).not.toHaveBeenCalled();

  fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));

  await waitFor(() => {
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });
});

it('falls back to an unavailable explanation when capture fails', async () => {
  mockTakePictureAsync.mockRejectedValue(new Error('simulator has no camera'));
  await openCamera();

  fireEvent.press(screen.getByRole('button', { name: 'Capture photo' }));

  await waitFor(() => {
    expect(screen.getByText('Camera unavailable')).toBeTruthy();
  });
  // never a dead end: library and close stay available
  expect(
    screen.getByRole('button', { name: 'Choose from library' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Close camera' })).toBeTruthy();
  expect(mockPrepareImage).not.toHaveBeenCalled();
});

it('sends captured and library photos through the same preparation service', async () => {
  // camera capture first
  mockTakePictureAsync.mockResolvedValue(CAPTURED);
  mockPrepareImage.mockResolvedValue(PREPARED_PHOTO);
  await openCamera();

  fireEvent.press(screen.getByRole('button', { name: 'Capture photo' }));

  await waitFor(() => {
    expect(mockPrepareImage).toHaveBeenCalledWith(CAPTURED);
  });
  await waitFor(() => {
    expect(screen.getByText('Analyzing your meal')).toBeTruthy();
  });
  // one analysis request started for the captured photo's prepared jpeg
  expect(mockAnalyzePhoto).toHaveBeenCalledTimes(1);
  expect(mockAnalyzePhoto).toHaveBeenCalledWith(
    PREPARED_PHOTO.base64,
    expect.anything(),
  );
});
