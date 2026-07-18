import { render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../src/services/widget', () => ({
  publishRemainingCalories: jest.fn(),
}));

import DashboardScreen from '../../src/app/index';
import { createMeal, type Meal } from '../../src/domain/nutrition';
import { DayProvider, useDay } from '../../src/state/day-context';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

// fixture meals are deterministic test-only data injected through the real
// acceptMeal action; there is no mock-meal product feature.
const FIXTURE_MEALS: Meal[] = [
  createMeal(
    {
      food: 'Greek yogurt bowl',
      calories: 320,
      protein_g: 22.5,
      carbs_g: 40,
      fat_g: 8.5,
      confidence: 0.9,
    },
    'scan-1',
    'file:///prepared/scan-1.jpg',
    1_752_770_000_000,
  ),
  createMeal(
    {
      food: 'Grilled chicken salad',
      calories: 550,
      protein_g: 42,
      carbs_g: 45,
      fat_g: 22,
      confidence: 0.88,
    },
    'scan-2',
    'file:///prepared/scan-2.jpg',
    1_752_773_600_000,
  ),
  createMeal(
    {
      food: 'Ramen bowl',
      calories: 610,
      protein_g: 28,
      carbs_g: 78.5,
      fat_g: 19,
      confidence: 0.81,
    },
    'scan-3',
    'file:///prepared/scan-3.jpg',
    1_752_777_200_000,
  ),
];

const OVER_GOAL_MEAL: Meal = createMeal(
  {
    food: 'Loaded burger platter',
    calories: 2400,
    protein_g: 60,
    carbs_g: 200,
    fat_g: 90,
    confidence: 0.85,
  },
  'scan-over',
  'file:///prepared/scan-over.jpg',
  1_752_780_800_000,
);

function SeedMeals({ meals }: { meals: readonly Meal[] }) {
  const { acceptMeal } = useDay();
  useEffect(() => {
    meals.forEach(acceptMeal);
  }, [acceptMeal, meals]);
  return null;
}

function renderDashboard(meals: readonly Meal[] = []) {
  return render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <DayProvider>
        <SeedMeals meals={meals} />
        <DashboardScreen />
      </DayProvider>
    </SafeAreaProvider>,
  );
}

describe('dashboard empty state', () => {
  it('renders the full daily goals with zero progress', async () => {
    await renderDashboard();

    // remaining calories equal the untouched goal
    expect(screen.getByText('2000')).toBeOnTheScreen();
    expect(screen.getByText('calories left')).toBeOnTheScreen();

    // ring progress is zero
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 0,
    });

    // each macro bar shows zero consumed and the full goal remaining
    expect(screen.getByText('0g of 150g')).toBeOnTheScreen();
    expect(screen.getByText('150g left')).toBeOnTheScreen();
    expect(screen.getByText('0g of 250g')).toBeOnTheScreen();
    expect(screen.getByText('250g left')).toBeOnTheScreen();
    expect(screen.getByText('0g of 70g')).toBeOnTheScreen();
    expect(screen.getByText('70g left')).toBeOnTheScreen();

    // designed empty state and the primary scan action
    expect(screen.getByText('No meals yet')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Scan meal' }),
    ).toBeOnTheScreen();
  });
});

describe('dashboard with three fixture meals', () => {
  it('renders every meal row with its label and calories', async () => {
    await renderDashboard(FIXTURE_MEALS);

    expect(screen.getByText('Greek yogurt bowl')).toBeOnTheScreen();
    expect(screen.getByText('Grilled chicken salad')).toBeOnTheScreen();
    expect(screen.getByText('Ramen bowl')).toBeOnTheScreen();
    expect(screen.getByText('320')).toBeOnTheScreen();
    expect(screen.getByText('550')).toBeOnTheScreen();
    expect(screen.getByText('610')).toBeOnTheScreen();
    expect(screen.queryByText('No meals yet')).not.toBeOnTheScreen();

    // each row keeps its own prepared thumbnail
    // expo-image normalizes the source prop into an array
    expect(screen.getByTestId('meal-thumbnail-scan-2').props.source).toEqual([
      { uri: 'file:///prepared/scan-2.jpg' },
    ]);
  });

  it('shows arithmetically exact totals and remaining values', async () => {
    await renderDashboard(FIXTURE_MEALS);

    // the numerals animate from the previous summary and must settle on the
    // exact derived totals, never a rounded in-flight frame value
    // calories: 320 + 550 + 610 = 1480 consumed, 520 remaining
    await waitFor(
      () => {
        expect(screen.getByText('520')).toBeOnTheScreen();
        // protein: 22.5 + 42 + 28 = 92.5 consumed, 57.5 remaining
        expect(screen.getByText('92.5g of 150g')).toBeOnTheScreen();
        expect(screen.getByText('57.5g left')).toBeOnTheScreen();
        // carbs: 40 + 45 + 78.5 = 163.5 consumed, 86.5 remaining
        expect(screen.getByText('163.5g of 250g')).toBeOnTheScreen();
        expect(screen.getByText('86.5g left')).toBeOnTheScreen();
        // fat: 8.5 + 22 + 19 = 49.5 consumed, 20.5 remaining
        expect(screen.getByText('49.5g of 70g')).toBeOnTheScreen();
        expect(screen.getByText('20.5g left')).toBeOnTheScreen();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText('calories left')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 74,
    });
  });

  it('applies the over-goal treatment when a goal is exceeded', async () => {
    await renderDashboard([OVER_GOAL_MEAL]);

    // calories: 2400 consumed against 2000 means 400 over
    await waitFor(
      () => {
        expect(screen.getByText('400')).toBeOnTheScreen();
        // fat: 90 consumed against 70 means 20 over; other macros stay under
        expect(screen.getByText('20g over')).toBeOnTheScreen();
        expect(screen.getByText('90g left')).toBeOnTheScreen();
        expect(screen.getByText('50g left')).toBeOnTheScreen();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText('calories over')).toBeOnTheScreen();
    // visual progress clamps at 100 even though remaining is negative
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 100,
    });
  });
});

describe('dashboard accessibility', () => {
  it('gives primary controls accessible names and >= 44pt targets', async () => {
    await renderDashboard(FIXTURE_MEALS);

    const scanButton = screen.getByRole('button', { name: 'Scan meal' });
    const scanStyle = StyleSheet.flatten(scanButton.props.style);
    expect(scanStyle.minHeight).toBeGreaterThanOrEqual(44);

    expect(
      screen.getByLabelText(
        'Grilled chicken salad, 550 calories, 42 grams protein, 45 grams carbs, 22 grams fat',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Protein: 92.5 grams consumed, 57.5 grams left'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('520 calories left today')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorie goal progress')).toBeOnTheScreen();
  });
});
