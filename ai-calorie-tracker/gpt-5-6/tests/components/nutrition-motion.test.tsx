import { render } from '@testing-library/react-native';

import {
  NUTRITION_MOTION_DURATION,
  NutritionSummary,
  getCalorieRingOffset,
} from '../../src/components/dashboard/NutritionSummary';
import {
  DAILY_GOALS,
  getDaySummary,
  getProgress,
  type Meal,
} from '../../src/domain/nutrition';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../src/services/widget', () => ({
  updateRemainingCaloriesWidget: jest.fn(),
}));

const meals: Meal[] = [
  {
    id: 'meal-1',
    food: 'Greek yogurt bowl',
    calories: 520,
    protein_g: 32.5,
    carbs_g: 68.2,
    fat_g: 14.1,
    confidence: 0.94,
    thumbnailUri: 'file:///meal-1.jpg',
    loggedAt: 1,
  },
  {
    id: 'meal-2',
    food: 'Chicken rice bowl',
    calories: 780,
    protein_g: 61.3,
    carbs_g: 92.4,
    fat_g: 18.7,
    confidence: 0.92,
    thumbnailUri: 'file:///meal-2.jpg',
    loggedAt: 2,
  },
  {
    id: 'meal-3',
    food: 'Salmon pasta',
    calories: 850,
    protein_g: 64.8,
    carbs_g: 101.6,
    fat_g: 42.5,
    confidence: 0.9,
    thumbnailUri: 'file:///meal-3.jpg',
    loggedAt: 3,
  },
];

describe('nutrition motion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses one motion window inside the required 450 to 650 ms range', () => {
    expect(NUTRITION_MOTION_DURATION).toBeGreaterThanOrEqual(450);
    expect(NUTRITION_MOTION_DURATION).toBeLessThanOrEqual(650);
  });

  it('settles every macro bar and computes the matching ring target', async () => {
    const screen = await render(
      <NutritionSummary summary={getDaySummary([])} />,
    );

    await screen.rerender(
      <NutritionSummary summary={getDaySummary(meals.slice(0, 1))} />,
    );
    jest.advanceTimersByTime(NUTRITION_MOTION_DURATION);

    expect(
      getCalorieRingOffset(
        getProgress(meals[0].calories, DAILY_GOALS.calories),
      ),
    ).toBeLessThan(getCalorieRingOffset(0));
    expect(screen.getByTestId('protein-progress')).toHaveAnimatedStyle({
      width: `${getProgress(meals[0].protein_g, DAILY_GOALS.protein_g) * 100}%`,
    });
    expect(screen.getByTestId('carbs-progress')).toHaveAnimatedStyle({
      width: `${getProgress(meals[0].carbs_g, DAILY_GOALS.carbs_g) * 100}%`,
    });
    expect(screen.getByTestId('fat-progress')).toHaveAnimatedStyle({
      width: `${getProgress(meals[0].fat_g, DAILY_GOALS.fat_g) * 100}%`,
    });
  });

  it('interrupts rapid updates and settles on exact three-meal totals', async () => {
    const screen = await render(
      <NutritionSummary summary={getDaySummary([])} />,
    );

    await screen.rerender(
      <NutritionSummary summary={getDaySummary(meals.slice(0, 1))} />,
    );
    await screen.rerender(
      <NutritionSummary summary={getDaySummary(meals.slice(0, 2))} />,
    );
    await screen.rerender(
      <NutritionSummary summary={getDaySummary(meals)} />,
    );
    jest.advanceTimersByTime(NUTRITION_MOTION_DURATION);

    expect(screen.getByText('-150')).toBeOnTheScreen();
    expect(screen.getByText('2150 of 2000 kcal')).toBeOnTheScreen();
    expect(getCalorieRingOffset(1)).toBe(0);
    expect(screen.getByTestId('protein-progress')).toHaveAnimatedStyle({
      width: '100%',
    });
    expect(screen.getByTestId('carbs-progress')).toHaveAnimatedStyle({
      width: '100%',
    });
    expect(screen.getByTestId('fat-progress')).toHaveAnimatedStyle({
      width: '100%',
    });
  });

});
