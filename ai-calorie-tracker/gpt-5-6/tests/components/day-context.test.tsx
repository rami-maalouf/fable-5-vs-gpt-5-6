import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type { Meal } from '../../src/domain/nutrition';
import {
  DAILY_GOALS,
  EMPTY_NUTRITION,
  getDaySummary,
} from '../../src/domain/nutrition';
import {
  DayProvider,
  dayReducer,
  useDay,
} from '../../src/state/day-context';
import { updateRemainingCaloriesWidget } from '../../src/services/widget';

jest.mock('../../src/services/widget', () => ({
  defaultCaloriesRemaining: 2_000,
  updateRemainingCaloriesWidget: jest.fn(),
}));

const meal: Meal = {
  id: 'scan-1',
  food: 'Greek Yogurt Bowl',
  calories: 520,
  protein_g: 32.5,
  carbs_g: 68.2,
  fat_g: 14.1,
  confidence: 0.94,
  thumbnailUri: 'file:///greek-yogurt.jpg',
  loggedAt: 1_700_000_000_000,
};

const rapidMeals: Meal[] = [
  meal,
  {
    ...meal,
    id: 'scan-2',
    food: 'Chicken rice bowl',
    calories: 780,
    protein_g: 61.3,
    carbs_g: 92.4,
    fat_g: 18.7,
    loggedAt: meal.loggedAt + 1,
  },
  {
    ...meal,
    id: 'scan-3',
    food: 'Salmon pasta',
    calories: 850,
    protein_g: 64.8,
    carbs_g: 101.6,
    fat_g: 42.5,
    loggedAt: meal.loggedAt + 2,
  },
];

function wrapper({ children }: PropsWithChildren) {
  return <DayProvider>{children}</DayProvider>;
}

describe('DayProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts empty, derives the fixed goals, and publishes the cold snapshot', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });

    expect(result.current.meals).toEqual([]);
    expect(result.current.summary).toEqual({
      consumed: EMPTY_NUTRITION,
      remaining: DAILY_GOALS,
    });

    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenCalledTimes(1);
    });
    expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(
      result.current.summary.remaining.calories,
    );
  });

  it('accepts a meal once and publishes the same derived remaining calories', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });
    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenCalledWith(2_000);
    });

    let firstAccepted = false;
    let duplicateAccepted = true;
    await act(() => {
      firstAccepted = result.current.acceptMeal(meal);
      duplicateAccepted = result.current.acceptMeal(meal);
    });

    expect(firstAccepted).toBe(true);
    expect(duplicateAccepted).toBe(false);
    expect(result.current.meals).toEqual([meal]);
    expect(result.current.summary).toEqual(getDaySummary([meal]));
    expect(updateRemainingCaloriesWidget).toHaveBeenCalledTimes(2);
    expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(
      result.current.summary.remaining.calories,
    );
  });

  it('settles three rapid accepted meals on one exact derived summary', async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });

    await act(() => {
      for (const acceptedMeal of rapidMeals) {
        expect(result.current.acceptMeal(acceptedMeal)).toBe(true);
      }
    });

    expect(result.current.meals).toEqual(rapidMeals);
    expect(result.current.summary).toEqual(getDaySummary(rapidMeals));
    expect(result.current.summary.consumed.calories).toBe(2_150);
    expect(result.current.summary.remaining.calories).toBe(-150);
    expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(-150);
  });

  it('keeps meal-only reducer state unchanged for duplicates and discard', () => {
    const accepted = dayReducer([], { type: 'accept-meal', meal });
    const duplicate = dayReducer(accepted, { type: 'accept-meal', meal });
    const discarded = dayReducer(accepted, { type: 'discard-result' });

    expect(accepted).toEqual([meal]);
    expect(duplicate).toBe(accepted);
    expect(discarded).toBe(accepted);
  });
});
