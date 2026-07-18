import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

// mock the expo-widgets-backed widget module so the real adapter runs in jest
const mockUpdateSnapshot = jest.fn();
jest.mock('../../widgets/RemainingCaloriesWidget', () => ({
  __esModule: true,
  default: {
    updateSnapshot: (props: unknown) => mockUpdateSnapshot(props),
  },
}));

import { createMeal } from '../../src/domain/nutrition';
import { publishRemainingCalories } from '../../src/services/widget';
import { DayProvider, useDay } from '../../src/state/day-context';

const wrapper = ({ children }: { children: ReactNode }) => (
  <DayProvider>{children}</DayProvider>
);

const RESULT = {
  food: 'Ramen bowl',
  calories: 610,
  protein_g: 28,
  carbs_g: 78.5,
  fat_g: 19,
  confidence: 0.81,
};

function makeMeal(id: string, calories: number) {
  return createMeal(
    { ...RESULT, calories },
    id,
    `file:///prepared/${id}.jpg`,
    1_752_770_000_000,
  );
}

beforeEach(() => {
  mockUpdateSnapshot.mockClear();
});

describe('widget snapshot adapter', () => {
  it('publishes the default goal with an empty ring on mount', async () => {
    await renderHook(() => useDay(), { wrapper });
    expect(mockUpdateSnapshot).toHaveBeenCalledTimes(1);
    expect(mockUpdateSnapshot).toHaveBeenCalledWith({
      remaining: 2000,
      progress: 0,
    });
  });

  it('publishes the exact derived remaining and clamped progress per accepted meal', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1-1', 610));
    });
    expect(mockUpdateSnapshot).toHaveBeenLastCalledWith({
      remaining: 1390,
      progress: 610 / 2000,
    });

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-2-1', 540));
    });
    expect(mockUpdateSnapshot).toHaveBeenLastCalledWith({
      remaining: 850,
      progress: 1150 / 2000,
    });

    // an over-goal day publishes the negative remaining with progress clamped to 1
    await act(() => {
      result.current.acceptMeal(makeMeal('scan-3-1', 1200));
    });
    expect(mockUpdateSnapshot).toHaveBeenLastCalledWith({
      remaining: -350,
      progress: 1,
    });
    expect(mockUpdateSnapshot).toHaveBeenCalledTimes(4);
  });

  it('does not publish a stale or extra snapshot for a rejected duplicate accept', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1-1', 610));
    });
    expect(mockUpdateSnapshot).toHaveBeenCalledTimes(2);

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1-1', 610));
    });
    expect(mockUpdateSnapshot).toHaveBeenCalledTimes(2);
    expect(mockUpdateSnapshot).toHaveBeenLastCalledWith({
      remaining: 1390,
      progress: 610 / 2000,
    });
  });

  it('rounds the published remaining value for display', () => {
    publishRemainingCalories(1389.6, 610.4 / 2000);
    expect(mockUpdateSnapshot).toHaveBeenCalledWith({
      remaining: 1390,
      progress: 610.4 / 2000,
    });
  });

  it('is a no-op off ios', () => {
    const replaced = jest.replaceProperty(Platform, 'OS', 'android');
    publishRemainingCalories(2000, 0);
    expect(mockUpdateSnapshot).not.toHaveBeenCalled();
    replaced.restore();
  });
});
