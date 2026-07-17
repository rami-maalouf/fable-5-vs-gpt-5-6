// recovery-path behavior over the real reducer and real day state:
// not-food routes through acquisition to a fresh photo, network and analysis
// failures retry the exact same prepared base64 under a new request id,
// rapid retries start only one replacement request, stale completions after
// discard change nothing, and discard or unmount cancels in-flight work
// without touching day state. out-of-order completions between two live
// requests are impossible at the screen level (the machine leaves analyzing
// only on completion or discard); that reducer guarantee is pinned in
// tests/domain/scan-machine.test.ts.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text } from 'react-native';
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

const mockNotificationAsync = jest.fn();
jest.mock('expo-haptics', () => ({
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  NotificationFeedbackType: { Success: 'success' },
}));

const mockPrepareImage = jest.fn();
jest.mock('../../src/services/prepare-image', () => ({
  prepareImage: (...args: unknown[]) => mockPrepareImage(...args),
}));

const mockAnalyzePhoto = jest.fn();
jest.mock('../../src/services/analyze-photo', () => ({
  analyzePhoto: (...args: unknown[]) => mockAnalyzePhoto(...args),
}));

jest.mock('../../src/services/widget', () => ({
  publishRemainingCalories: jest.fn(),
}));

import ScanScreen from '../../src/app/scan';
import type { AnalysisOutcome } from '../../src/services/analyze-photo';
import { publishRemainingCalories } from '../../src/services/widget';
import type { ScanSuccess } from '../../src/domain/scan-contract';
import type { PreparedPhoto } from '../../src/domain/scan-machine';
import { DayProvider, useDay } from '../../src/state/day-context';

const mockPublish = publishRemainingCalories as jest.Mock;

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const FIRST_ASSET = {
  uri: 'file:///picked/board.jpg',
  width: 1024,
  height: 683,
};

const SECOND_ASSET = {
  uri: 'file:///picked/salad.jpg',
  width: 1536,
  height: 2048,
};

const FIRST_PHOTO: PreparedPhoto = {
  uri: 'file:///cache/prepared-board.jpg',
  base64: 'Ym9hcmQ=',
  width: 1024,
  height: 683,
};

const SECOND_PHOTO: PreparedPhoto = {
  uri: 'file:///cache/prepared-salad.jpg',
  base64: 'c2FsYWQ=',
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

// mirrors what a dashboard consumer would see so error-path exits can prove
// day state never changed
function DayProbe() {
  const { meals, summary } = useDay();
  return (
    <>
      <Text testID="probe-meal-count">{String(meals.length)}</Text>
      <Text testID="probe-meal-ids">
        {meals.map((meal) => meal.id).join(',')}
      </Text>
      <Text testID="probe-remaining">
        {String(summary.remaining.calories)}
      </Text>
    </>
  );
}

async function renderScanWithDay() {
  const utils = await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <DayProvider>
        <ScanScreen />
        <DayProbe />
      </DayProvider>
    </SafeAreaProvider>,
  );
  return utils;
}

// drives acquisition -> preparing -> analyzing for the first photo; the
// analysis outcome must be queued on mockAnalyzePhoto by the caller
async function reachFirstAnalysis() {
  mockLaunchImageLibraryAsync.mockResolvedValueOnce({
    canceled: false,
    assets: [FIRST_ASSET],
  });
  mockPrepareImage.mockResolvedValueOnce(FIRST_PHOTO);
  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
  await waitFor(() => {
    expect(mockAnalyzePhoto).toHaveBeenCalledTimes(1);
  });
}

function probeText(testID: string) {
  return screen.getByTestId(testID).children.join('');
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('not-food offers try another photo, and a fresh pick reaches a real result', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'not_food',
  } satisfies AnalysisOutcome);
  await renderScanWithDay();
  await reachFirstAnalysis();

  // distinct not-food surface with both recovery actions
  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });
  expect(screen.getByText("That doesn't look like food")).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Try another photo' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();

  // try another photo returns to acquisition, not to analyzing
  fireEvent.press(screen.getByRole('button', { name: 'Try another photo' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Choose from library' }),
    ).toBeTruthy();
  });

  // a subsequent successful pick and analysis reaches the result card
  mockLaunchImageLibraryAsync.mockResolvedValueOnce({
    canceled: false,
    assets: [SECOND_ASSET],
  });
  mockPrepareImage.mockResolvedValueOnce(SECOND_PHOTO);
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'success',
    result: RESULT,
  } satisfies AnalysisOutcome);
  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));

  await waitFor(() => {
    expect(screen.getByTestId('result-card')).toBeTruthy();
  });
  // the second request carried the new photo, not the rejected one
  expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);
  expect(mockAnalyzePhoto).toHaveBeenLastCalledWith(
    SECOND_PHOTO.base64,
    expect.any(AbortSignal),
  );
  expect(screen.getByText(RESULT.food)).toBeTruthy();
});

it('network failure explains the connection and retry re-sends the same base64 to success', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'failure',
    reason: 'network',
  } satisfies AnalysisOutcome);
  await renderScanWithDay();
  await reachFirstAnalysis();

  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });
  // network copy points at the connection, not at the analysis
  expect(screen.getByText("Couldn't reach the analyzer")).toBeTruthy();
  expect(screen.getByText(/check your connection/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry analysis' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();

  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'success',
    result: RESULT,
  } satisfies AnalysisOutcome);
  fireEvent.press(screen.getByRole('button', { name: 'Retry analysis' }));

  await waitFor(() => {
    expect(screen.getByTestId('result-card')).toBeTruthy();
  });
  // the retry sent the exact same prepared image, no re-pick involved
  expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);
  expect(mockAnalyzePhoto).toHaveBeenNthCalledWith(
    1,
    FIRST_PHOTO.base64,
    expect.any(AbortSignal),
  );
  expect(mockAnalyzePhoto).toHaveBeenNthCalledWith(
    2,
    FIRST_PHOTO.base64,
    expect.any(AbortSignal),
  );
  expect(mockPrepareImage).toHaveBeenCalledTimes(1);
});

it('analysis failure uses distinct copy from the network variant', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'failure',
    reason: 'analysis',
  } satisfies AnalysisOutcome);
  await renderScanWithDay();
  await reachFirstAnalysis();

  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });
  expect(screen.getByText('Analysis failed')).toBeTruthy();
  expect(screen.queryByText(/check your connection/i)).toBeNull();
  expect(screen.getByRole('button', { name: 'Retry analysis' })).toBeTruthy();
});

it('rapid double retry starts exactly one replacement request and the latest request id lands', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'failure',
    reason: 'network',
  } satisfies AnalysisOutcome);
  await renderScanWithDay();
  await reachFirstAnalysis();
  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });

  // the retry request stays in flight until this test resolves it
  let resolveRetry: (outcome: AnalysisOutcome) => void = () => {};
  mockAnalyzePhoto.mockImplementationOnce(
    () =>
      new Promise<AnalysisOutcome>((resolve) => {
        resolveRetry = resolve;
      }),
  );
  const retry = screen.getByRole('button', { name: 'Retry analysis' });
  fireEvent.press(retry);
  await waitFor(() => {
    expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);
  });

  // a second rapid press lands while the machine is already analyzing; the
  // reducer ignores it, so no third request may start
  fireEvent.press(retry);
  await waitFor(() => {
    expect(screen.queryByTestId('error-card')).toBeNull();
  });
  expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);

  resolveRetry({ kind: 'success', result: RESULT });
  await waitFor(() => {
    expect(screen.getByTestId('result-card')).toBeTruthy();
  });

  // accepting proves the surviving screen belongs to the retry request id
  fireEvent.press(screen.getByRole('button', { name: 'Accept' }));
  await waitFor(() => {
    expect(probeText('probe-meal-ids')).toBe('scan-2');
  });
  expect(probeText('probe-meal-count')).toBe('1');
});

it('a stale failure resolving after discard changes nothing', async () => {
  let resolveAnalysis: (outcome: AnalysisOutcome) => void = () => {};
  mockAnalyzePhoto.mockImplementationOnce(
    () =>
      new Promise<AnalysisOutcome>((resolve) => {
        resolveAnalysis = resolve;
      }),
  );
  await renderScanWithDay();
  await reachFirstAnalysis();

  fireEvent.press(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  );
  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // the late failure ignores its abort and resolves anyway; the reducer
  // rejects it because the screen already left analyzing
  resolveAnalysis({ kind: 'failure', reason: 'network' });
  await waitFor(() => {
    expect(screen.queryByTestId('error-card')).toBeNull();
  });
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(probeText('probe-meal-count')).toBe('0');
  expect(probeText('probe-remaining')).toBe('2000');
});

it.each([
  ['not-food', { kind: 'not_food' } satisfies AnalysisOutcome],
  [
    'network failure',
    { kind: 'failure', reason: 'network' } satisfies AnalysisOutcome,
  ],
  [
    'analysis failure',
    { kind: 'failure', reason: 'analysis' } satisfies AnalysisOutcome,
  ],
])('discard from the %s card closes without touching day state', async (
  _label,
  outcome,
) => {
  mockAnalyzePhoto.mockResolvedValueOnce(outcome);
  await renderScanWithDay();
  const publishCallsAfterMount = mockPublish.mock.calls.length;
  await reachFirstAnalysis();
  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });

  fireEvent.press(screen.getByRole('button', { name: 'Discard' }));

  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  expect(probeText('probe-meal-count')).toBe('0');
  expect(probeText('probe-remaining')).toBe('2000');
  expect(mockPublish.mock.calls.length).toBe(publishCallsAfterMount);
  expect(mockNotificationAsync).not.toHaveBeenCalled();
});

it('discard during a retry aborts the in-flight request and leaves day state alone', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'failure',
    reason: 'network',
  } satisfies AnalysisOutcome);
  await renderScanWithDay();
  await reachFirstAnalysis();
  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });

  // retry starts a second request that never resolves
  mockAnalyzePhoto.mockReturnValueOnce(new Promise<never>(() => {}));
  fireEvent.press(screen.getByRole('button', { name: 'Retry analysis' }));
  await waitFor(() => {
    expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);
  });
  const retrySignal = mockAnalyzePhoto.mock.calls[1][1] as AbortSignal;
  expect(retrySignal.aborted).toBe(false);

  fireEvent.press(
    screen.getByRole('button', { name: 'Discard photo and close' }),
  );

  await waitFor(() => {
    expect(retrySignal.aborted).toBe(true);
  });
  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  expect(probeText('probe-meal-count')).toBe('0');
  expect(probeText('probe-remaining')).toBe('2000');
});

it('unmount during a retry aborts the in-flight request', async () => {
  mockAnalyzePhoto.mockResolvedValueOnce({
    kind: 'failure',
    reason: 'network',
  } satisfies AnalysisOutcome);
  const { unmount } = await renderScanWithDay();
  await reachFirstAnalysis();
  await waitFor(() => {
    expect(screen.getByTestId('error-card')).toBeTruthy();
  });

  mockAnalyzePhoto.mockReturnValueOnce(new Promise<never>(() => {}));
  fireEvent.press(screen.getByRole('button', { name: 'Retry analysis' }));
  await waitFor(() => {
    expect(mockAnalyzePhoto).toHaveBeenCalledTimes(2);
  });
  const retrySignal = mockAnalyzePhoto.mock.calls[1][1] as AbortSignal;
  expect(retrySignal.aborted).toBe(false);

  unmount();

  await waitFor(() => {
    expect(retrySignal.aborted).toBe(true);
  });
});
