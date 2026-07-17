// scan analysis and result behavior: analyzing starts exactly one request
// with the prepared base64, every result field renders, not-food and failure
// placeholders appear, stale responses change nothing, and unmount aborts.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
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

const mockPrepareImage = jest.fn();
jest.mock('../../src/services/prepare-image', () => ({
  prepareImage: (...args: unknown[]) => mockPrepareImage(...args),
}));

const mockAnalyzePhoto = jest.fn();
jest.mock('../../src/services/analyze-photo', () => ({
  analyzePhoto: (...args: unknown[]) => mockAnalyzePhoto(...args),
}));

import ScanScreen from '../../src/app/scan';
import type { AnalysisOutcome } from '../../src/services/analyze-photo';
import type { ScanSuccess } from '../../src/domain/scan-contract';
import type { PreparedPhoto } from '../../src/domain/scan-machine';

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

const RESULT: ScanSuccess = {
  food: 'Grilled chicken salad bowl',
  calories: 550,
  protein_g: 42,
  carbs_g: 45.5,
  fat_g: 22,
  confidence: 0.88,
};

async function renderScan() {
  const utils = await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <ScanScreen />
    </SafeAreaProvider>,
  );
  return utils;
}

// drives acquisition -> preparing -> analyzing with the prepared photo
async function reachAnalyzing() {
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [PICKED_ASSET],
  });
  mockPrepareImage.mockResolvedValue(PREPARED_PHOTO);
  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
  await waitFor(() => {
    expect(mockAnalyzePhoto).toHaveBeenCalledTimes(1);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('starts exactly one analysis with the prepared base64 and an abort signal', async () => {
  mockAnalyzePhoto.mockReturnValue(new Promise<never>(() => {}));
  await renderScan();

  await reachAnalyzing();

  expect(screen.getByText('Analyzing your meal')).toBeTruthy();
  expect(mockAnalyzePhoto).toHaveBeenCalledTimes(1);
  expect(mockAnalyzePhoto).toHaveBeenCalledWith(
    PREPARED_PHOTO.base64,
    expect.any(AbortSignal),
  );
});

it('renders every required result field over the same photo on success', async () => {
  mockAnalyzePhoto.mockResolvedValue({
    kind: 'success',
    result: RESULT,
  } satisfies AnalysisOutcome);
  await renderScan();

  await reachAnalyzing();

  await waitFor(() => {
    expect(screen.getByTestId('result-card')).toBeTruthy();
  });
  // identified food, calories, and all three macros with display formatting
  expect(screen.getByText('Grilled chicken salad bowl')).toBeTruthy();
  expect(screen.getByText('550')).toBeTruthy();
  expect(screen.getByText('42g')).toBeTruthy();
  expect(screen.getByText('45.5g')).toBeTruthy();
  expect(screen.getByText('22g')).toBeTruthy();
  // the result is clearly labelled as an estimate, not a measurement
  expect(screen.getByText('AI estimate')).toBeTruthy();
  expect(screen.getByText('estimated calories')).toBeTruthy();
  // both actions are present and accessible
  expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
  // the photo stays mounted from the prepared uri
  expect(screen.getByTestId('scan-photo').props.source).toEqual([
    { uri: PREPARED_PHOTO.uri },
  ]);
});

it('locks accept after the first press', async () => {
  mockAnalyzePhoto.mockResolvedValue({
    kind: 'success',
    result: RESULT,
  } satisfies AnalysisOutcome);
  await renderScan();
  await reachAnalyzing();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy();
  });

  fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Accept' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });
  // the modal stays open; day-state logging arrives in a later build
  expect(mockBack).not.toHaveBeenCalled();
});

it('shows a readable not-food placeholder with discard available', async () => {
  mockAnalyzePhoto.mockResolvedValue({
    kind: 'not_food',
  } satisfies AnalysisOutcome);
  await renderScan();

  await reachAnalyzing();

  await waitFor(() => {
    expect(screen.getByText(/doesn't look like food/i)).toBeTruthy();
  });
  expect(screen.getByTestId('scan-photo').props.source).toEqual([
    { uri: PREPARED_PHOTO.uri },
  ]);
  expect(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  ).toBeTruthy();
});

it('shows a readable failure placeholder with discard available', async () => {
  mockAnalyzePhoto.mockResolvedValue({
    kind: 'failure',
    reason: 'network',
  } satisfies AnalysisOutcome);
  await renderScan();

  await reachAnalyzing();

  await waitFor(() => {
    expect(screen.getByText(/could not reach/i)).toBeTruthy();
  });
  expect(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  ).toBeTruthy();
});

it('ignores a stale response that resolves after discard', async () => {
  let resolveAnalysis: (outcome: AnalysisOutcome) => void = () => {};
  mockAnalyzePhoto.mockImplementation(
    () =>
      new Promise<AnalysisOutcome>((resolve) => {
        resolveAnalysis = resolve;
      }),
  );
  await renderScan();
  await reachAnalyzing();

  // discard while the request is in flight; the modal closes
  fireEvent.press(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  );
  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // a rogue late success (mock ignores the abort) must change nothing
  resolveAnalysis({ kind: 'success', result: RESULT });
  await waitFor(() => {
    expect(screen.queryByTestId('result-card')).toBeNull();
  });
  expect(mockBack).toHaveBeenCalledTimes(1);
});

it('aborts the in-flight request on discard', async () => {
  mockAnalyzePhoto.mockReturnValue(new Promise<never>(() => {}));
  await renderScan();
  await reachAnalyzing();
  const signal = mockAnalyzePhoto.mock.calls[0][1] as AbortSignal;
  expect(signal.aborted).toBe(false);

  fireEvent.press(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  );

  await waitFor(() => {
    expect(signal.aborted).toBe(true);
  });
});

it('aborts the in-flight request on unmount', async () => {
  mockAnalyzePhoto.mockReturnValue(new Promise<never>(() => {}));
  const { unmount } = await renderScan();
  await reachAnalyzing();
  const signal = mockAnalyzePhoto.mock.calls[0][1] as AbortSignal;
  expect(signal.aborted).toBe(false);

  unmount();

  await waitFor(() => {
    expect(signal.aborted).toBe(true);
  });
});
