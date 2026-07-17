import {
  DAILY_GOALS,
  EMPTY_NUTRITION,
  formatCalories,
  formatMacro,
  getDaySummary,
  getProgress,
  type Meal,
} from '../../src/domain/nutrition';
import { parseScanResult } from '../../src/domain/scan-contract';

const meals: Meal[] = [
  {
    id: 'meal-1',
    food: 'Greek yogurt',
    calories: 180.4,
    protein_g: 20.25,
    carbs_g: 14.2,
    fat_g: 4.05,
    confidence: 0.94,
    thumbnailUri: 'file:///yogurt.jpg',
    loggedAt: 1,
  },
  {
    id: 'meal-2',
    food: 'Chicken bowl',
    calories: 840.35,
    protein_g: 64.15,
    carbs_g: 91.25,
    fat_g: 24.1,
    confidence: 0.91,
    thumbnailUri: 'file:///bowl.jpg',
    loggedAt: 2,
  },
  {
    id: 'meal-3',
    food: 'Pasta',
    calories: 1_120.5,
    protein_g: 69.7,
    carbs_g: 171.05,
    fat_g: 46.25,
    confidence: 0.89,
    thumbnailUri: 'file:///pasta.jpg',
    loggedAt: 3,
  },
];

describe('nutrition rules', () => {
  it('derives empty totals from the fixed goals', () => {
    expect(getDaySummary([])).toEqual({
      consumed: EMPTY_NUTRITION,
      remaining: DAILY_GOALS,
    });
  });

  it('derives exact one-meal totals without mutating the input', () => {
    const input = [meals[0]];

    expect(getDaySummary(input)).toEqual({
      consumed: {
        calories: 180.4,
        protein_g: 20.25,
        carbs_g: 14.2,
        fat_g: 4.05,
      },
      remaining: {
        calories: 1_819.6,
        protein_g: 129.75,
        carbs_g: 235.8,
        fat_g: 65.95,
      },
    });
    expect(input).toEqual([meals[0]]);
  });

  it('keeps exact decimal totals and negative remaining values over goal', () => {
    expect(getDaySummary(meals)).toEqual({
      consumed: {
        calories: 2_141.25,
        protein_g: 154.1,
        carbs_g: 276.5,
        fat_g: 74.4,
      },
      remaining: {
        calories: -141.25,
        protein_g: -4.1,
        carbs_g: -26.5,
        fat_g: -4.4,
      },
    });
  });

  it('rounds display values without changing domain totals', () => {
    expect(formatCalories(1_819.6)).toBe('1820');
    expect(formatCalories(-141.25)).toBe('-141');
    expect(formatMacro(14)).toBe('14');
    expect(formatMacro(14.04)).toBe('14');
    expect(formatMacro(14.05)).toBe('14.1');
  });

  it('clamps visual progress while preserving over-goal arithmetic', () => {
    expect(getProgress(0, 2_000)).toBe(0);
    expect(getProgress(1_000, 2_000)).toBe(0.5);
    expect(getProgress(2_141.25, 2_000)).toBe(1);
    expect(getProgress(-10, 2_000)).toBe(0);
    expect(getProgress(10, 0)).toBe(0);
  });
});

describe('scan result validation', () => {
  const validResult = {
    food: 'Soup',
    calories: 320,
    protein_g: 14.5,
    carbs_g: 41,
    fat_g: 11.2,
    confidence: 0.87,
  };

  it('accepts valid food and not-food results', () => {
    expect(parseScanResult(validResult)).toEqual(validResult);
    expect(parseScanResult({ error: 'not_food' })).toEqual({ error: 'not_food' });
  });

  it.each([
    { ...validResult, calories: -1 },
    { ...validResult, protein_g: Number.NaN },
    { ...validResult, carbs_g: Number.POSITIVE_INFINITY },
    { ...validResult, confidence: 1.01 },
    { ...validResult, confidence: -0.01 },
    { ...validResult, food: '' },
    { ...validResult, extra: true },
    { error: 'unknown' },
    null,
  ])('rejects malformed external data: %p', (value) => {
    expect(() => parseScanResult(value)).toThrow();
  });
});
