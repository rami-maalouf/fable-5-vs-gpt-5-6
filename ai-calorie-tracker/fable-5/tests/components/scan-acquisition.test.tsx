// scan screen acquisition behavior: picker cancellation stays error-free,
// selection keeps the photo mounted through preparing into analyzing, and
// close dispatches discard which dismisses the modal.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

const mockPrepareImage = jest.fn();
jest.mock('../../src/services/prepare-image', () => ({
  prepareImage: (...args: unknown[]) => mockPrepareImage(...args),
}));

// analysis stays pending so this suite can assert the analyzing state;
// completion behavior is covered by scan-result.test.tsx
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

beforeEach(() => {
  jest.clearAllMocks();
  mockAnalyzePhoto.mockReturnValue(new Promise(() => {}));
});

it('renders both acquisition choices and a close control', async () => {
  await renderScan();

  expect(screen.getByRole('button', { name: 'Take photo' })).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Choose from library' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Close scan' })).toBeTruthy();
});

it('returns to acquisition without an error when the picker is cancelled', async () => {
  mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
  await renderScan();

  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));

  await waitFor(() => {
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
  });
  // still on acquisition, no error copy, no preparation started
  expect(screen.getByRole('button', { name: 'Choose from library' })).toBeTruthy();
  expect(screen.queryByText(/could not be read/i)).toBeNull();
  expect(mockPrepareImage).not.toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
});

it('requests images only, without editing, at full quality', async () => {
  mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
  await renderScan();

  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));

  await waitFor(() => {
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
  });
});

it('keeps the selected photo mounted from preparing into analyzing', async () => {
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [PICKED_ASSET],
  });
  let resolvePrepare: (photo: PreparedPhoto) => void = () => {};
  mockPrepareImage.mockImplementation(
    () =>
      new Promise<PreparedPhoto>((resolve) => {
        resolvePrepare = resolve;
      }),
  );
  await renderScan();

  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));

  // preparing: the picked photo is full screen under an honest indicator
  await waitFor(() => {
    expect(screen.getByText('Preparing photo')).toBeTruthy();
  });
  expect(screen.getByTestId('scan-photo').props.source).toEqual([
    { uri: PICKED_ASSET.uri },
  ]);
  expect(mockPrepareImage).toHaveBeenCalledWith(PICKED_ASSET);

  resolvePrepare(PREPARED_PHOTO);

  // analyzing: the base photo layer keeps the original picked uri while the
  // prepared jpeg crossfades in above it, so nothing swaps or blanks
  await waitFor(() => {
    expect(screen.getByText('Analyzing your meal')).toBeTruthy();
  });
  expect(screen.getByTestId('scan-photo').props.source).toEqual([
    { uri: PICKED_ASSET.uri },
  ]);
  expect(screen.getByTestId('scan-photo-prepared').props.source).toEqual([
    { uri: PREPARED_PHOTO.uri },
  ]);
});

it('returns to acquisition with a readable notice when preparation fails', async () => {
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [PICKED_ASSET],
  });
  mockPrepareImage.mockRejectedValue(new Error('decode failed'));
  await renderScan();

  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));

  await waitFor(() => {
    expect(screen.getByText(/could not be read/i)).toBeTruthy();
  });
  expect(screen.getByRole('button', { name: 'Choose from library' })).toBeTruthy();
  expect(mockBack).not.toHaveBeenCalled();
});

it('dismisses the modal when close is pressed', async () => {
  await renderScan();

  fireEvent.press(screen.getByRole('button', { name: 'Close scan' }));

  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
