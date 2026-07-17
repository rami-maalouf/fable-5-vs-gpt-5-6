// accept and discard end to end against real day state: accept logs exactly
// one meal keyed by the request id with the prepared thumbnail, fires one
// success haptic, publishes the identical remaining value to the widget, and
// requests the modal close only after the meal is committed. discard from
// result changes nothing.
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

// mirrors the day state a dashboard consumer would see; also exposes the
// latest snapshot to the test scope so mockBack can observe commit order
const latestDay = { mealCount: 0 };

function DayProbe() {
  const { meals, summary } = useDay();
  latestDay.mealCount = meals.length;
  return (
    <>
      <Text testID="probe-meal-count">{String(meals.length)}</Text>
      <Text testID="probe-meal-ids">
        {meals.map((meal) => meal.id).join(',')}
      </Text>
      <Text testID="probe-meal-thumbs">
        {meals.map((meal) => meal.thumbnailUri).join(',')}
      </Text>
      <Text testID="probe-remaining">
        {String(summary.remaining.calories)}
      </Text>
      <Text testID="probe-consumed">
        {[
          summary.consumed.calories,
          summary.consumed.protein_g,
          summary.consumed.carbs_g,
          summary.consumed.fat_g,
        ].join('|')}
      </Text>
    </>
  );
}

async function renderScanWithDay() {
  await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <DayProvider>
        <ScanScreen />
        <DayProbe />
      </DayProvider>
    </SafeAreaProvider>,
  );
}

// drives acquisition -> preparing -> analyzing -> result with the real reducer
async function reachResult() {
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [PICKED_ASSET],
  });
  mockPrepareImage.mockResolvedValue(PREPARED_PHOTO);
  mockAnalyzePhoto.mockResolvedValue({
    kind: 'success',
    result: RESULT,
  } satisfies AnalysisOutcome);
  fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  latestDay.mealCount = 0;
});

it('logs exactly one meal with the prepared thumbnail even with rapid repeated accepts', async () => {
  await renderScanWithDay();
  await reachResult();

  const accept = screen.getByRole('button', { name: 'Accept' });
  fireEvent.press(accept);
  await waitFor(() => {
    expect(screen.getByTestId('probe-meal-count').children.join('')).toBe('1');
  });

  // the machine locks the button after the first press, and the meal id is
  // request-scoped, so repeated presses can never log a second meal
  fireEvent.press(accept);
  fireEvent.press(accept);
  await waitFor(() => {
    expect(screen.getByTestId('probe-meal-count').children.join('')).toBe('1');
  });
  // the meal id is derived from the request id, so day state also rejects
  // any duplicate accept of the same result
  expect(screen.getByTestId('probe-meal-ids').children.join('')).toBe(
    'scan-1',
  );
  expect(screen.getByTestId('probe-meal-thumbs').children.join('')).toBe(
    PREPARED_PHOTO.uri,
  );
  // one success haptic on the first press only
  expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
  expect(mockNotificationAsync).toHaveBeenCalledWith('success');
});

it('derives the dashboard summary from the accepted result and publishes the identical remaining value', async () => {
  await renderScanWithDay();
  // the provider publishes the default goal once on mount
  expect(mockPublish).toHaveBeenCalledTimes(1);
  expect(mockPublish).toHaveBeenCalledWith(2000);
  await reachResult();

  fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

  await waitFor(() => {
    expect(screen.getByTestId('probe-remaining').children.join('')).toBe(
      '1450',
    );
  });
  expect(screen.getByTestId('probe-consumed').children.join('')).toBe(
    '550|42|45.5|22',
  );
  // the widget receives exactly the value the dashboard selectors derive
  expect(mockPublish).toHaveBeenLastCalledWith(1450);
  expect(mockPublish).toHaveBeenCalledTimes(2);
});

it('discard from result leaves meals, totals, and widget untouched', async () => {
  await renderScanWithDay();
  await reachResult();
  const publishCallsAfterMount = mockPublish.mock.calls.length;

  fireEvent.press(screen.getByRole('button', { name: 'Discard' }));

  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  expect(screen.getByTestId('probe-meal-count').children.join('')).toBe('0');
  expect(screen.getByTestId('probe-remaining').children.join('')).toBe('2000');
  expect(mockPublish.mock.calls.length).toBe(publishCallsAfterMount);
  expect(mockNotificationAsync).not.toHaveBeenCalled();
});

it('requests the modal close only after the meal is committed to day state', async () => {
  let mealCountWhenBackRequested = -1;
  mockBack.mockImplementation(() => {
    mealCountWhenBackRequested = latestDay.mealCount;
  });
  await renderScanWithDay();
  await reachResult();

  fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  // the dismissal effect ran in the commit that already contained the meal
  expect(mealCountWhenBackRequested).toBe(1);
  // repeated renders never request a second dismissal
  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
