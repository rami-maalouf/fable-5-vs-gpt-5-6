import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

jest.mock('../../src/services/widget', () => ({
  publishRemainingCalories: jest.fn(),
}));

import { createMeal } from '../../src/domain/nutrition';
import { publishRemainingCalories } from '../../src/services/widget';
import { DayProvider, useDay } from '../../src/state/day-context';

const mockPublish = publishRemainingCalories as jest.Mock;

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

function makeMeal(id: string, calories = RESULT.calories) {
  return createMeal(
    { ...RESULT, calories },
    id,
    `file:///prepared/${id}.jpg`,
    1_752_770_000_000,
  );
}

beforeEach(() => {
  mockPublish.mockClear();
});

describe('DayProvider', () => {
  it('starts empty and derives the exact fixed goals', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    expect(result.current.meals).toEqual([]);
    expect(result.current.summary.remaining).toEqual({
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 70,
    });
  });

  it('publishes the default remaining calories to the widget on mount', async () => {
    await renderHook(() => useDay(), { wrapper });
    expect(mockPublish).toHaveBeenCalledWith(2000);
  });

  it('accepts a unique meal exactly once', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    const meal = makeMeal('scan-1');

    await act(() => {
      result.current.acceptMeal(meal);
    });
    expect(result.current.meals).toHaveLength(1);
    expect(result.current.summary.remaining.calories).toBe(1390);

    // duplicate accept of the same meal id changes nothing
    await act(() => {
      result.current.acceptMeal(meal);
    });
    expect(result.current.meals).toHaveLength(1);
    expect(result.current.summary.remaining.calories).toBe(1390);
  });

  it('publishes the identical derived remaining value after each accept', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1', 610));
    });
    expect(mockPublish).toHaveBeenLastCalledWith(1390);

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-2', 540));
    });
    expect(mockPublish).toHaveBeenLastCalledWith(850);

    expect(result.current.summary.remaining.calories).toBe(850);
  });

  it('does not re-publish for a rejected duplicate accept', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1'));
    });
    const calls = mockPublish.mock.calls.length;

    await act(() => {
      result.current.acceptMeal(makeMeal('scan-1'));
    });
    expect(mockPublish.mock.calls.length).toBe(calls);
  });

  it('keeps the prepared thumbnail uri on the logged meal', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    await act(() => {
      result.current.acceptMeal(makeMeal('scan-9'));
    });
    expect(result.current.meals[0].thumbnailUri).toBe(
      'file:///prepared/scan-9.jpg',
    );
  });
});
