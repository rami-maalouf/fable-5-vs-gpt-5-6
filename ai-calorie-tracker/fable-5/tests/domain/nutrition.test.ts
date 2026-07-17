import {
  clampProgress,
  createMeal,
  DAILY_GOALS,
  formatCalories,
  formatGrams,
  getDaySummary,
  type Meal,
} from '../../src/domain/nutrition';

function meal(overrides: Partial<Meal> & { id: string }): Meal {
  return {
    food: 'test meal',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    confidence: 0.9,
    thumbnailUri: 'file:///tmp/photo.jpg',
    loggedAt: 1,
    ...overrides,
  };
}

describe('getDaySummary', () => {
  it('derives the exact fixed goals from zero meals', () => {
    const summary = getDaySummary([]);
    expect(summary.consumed).toEqual({
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    });
    expect(summary.remaining).toEqual({
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 70,
    });
  });

  it('computes one-meal totals exactly', () => {
    const summary = getDaySummary([
      meal({ id: 'a', calories: 540, protein_g: 38.5, carbs_g: 42, fat_g: 22.5 }),
    ]);
    expect(summary.consumed.calories).toBe(540);
    expect(summary.remaining.calories).toBe(1460);
    expect(summary.remaining.protein_g).toBe(111.5);
    expect(summary.remaining.fat_g).toBe(47.5);
  });

  it('computes three-meal totals with decimals exactly', () => {
    const summary = getDaySummary([
      meal({ id: 'a', calories: 540, protein_g: 38.5, carbs_g: 42, fat_g: 22.5 }),
      meal({ id: 'b', calories: 620.5, protein_g: 31, carbs_g: 55.5, fat_g: 28 }),
      meal({ id: 'c', calories: 310, protein_g: 12.25, carbs_g: 40, fat_g: 9.75 }),
    ]);
    expect(summary.consumed.calories).toBeCloseTo(1470.5, 10);
    expect(summary.consumed.protein_g).toBeCloseTo(81.75, 10);
    expect(summary.consumed.carbs_g).toBeCloseTo(137.5, 10);
    expect(summary.consumed.fat_g).toBeCloseTo(60.25, 10);
    expect(summary.remaining.calories).toBeCloseTo(529.5, 10);
  });

  it('allows negative remaining values when over goal', () => {
    const summary = getDaySummary([
      meal({ id: 'a', calories: 1500, fat_g: 50 }),
      meal({ id: 'b', calories: 900, fat_g: 45 }),
    ]);
    expect(summary.remaining.calories).toBe(-400);
    expect(summary.remaining.fat_g).toBe(-25);
  });
});

describe('display rounding', () => {
  it('formats calories as whole numbers', () => {
    expect(formatCalories(540)).toBe('540');
    expect(formatCalories(529.5)).toBe('530');
    expect(formatCalories(-400.4)).toBe('-400');
  });

  it('formats grams to at most one decimal place', () => {
    expect(formatGrams(42)).toBe('42');
    expect(formatGrams(38.54)).toBe('38.5');
    expect(formatGrams(81.75)).toBe('81.8');
    expect(formatGrams(-25.04)).toBe('-25');
  });
});

describe('clampProgress', () => {
  it('clamps visual progress to the range 0 to 1', () => {
    expect(clampProgress(0, 2000)).toBe(0);
    expect(clampProgress(500, 2000)).toBe(0.25);
    expect(clampProgress(2000, 2000)).toBe(1);
    expect(clampProgress(2400, 2000)).toBe(1);
    expect(clampProgress(-10, 2000)).toBe(0);
  });

  it('returns 0 for a non-positive goal instead of dividing by zero', () => {
    expect(clampProgress(100, 0)).toBe(0);
  });
});

describe('createMeal', () => {
  it('copies validated result fields and keeps the prepared thumbnail uri', () => {
    const created = createMeal(
      {
        food: 'Grilled salmon',
        calories: 540,
        protein_g: 38.5,
        carbs_g: 42,
        fat_g: 22.5,
        confidence: 0.87,
      },
      'scan-3',
      'file:///prepared/photo-3.jpg',
      1_752_770_000_000,
    );
    expect(created).toEqual({
      id: 'scan-3',
      food: 'Grilled salmon',
      calories: 540,
      protein_g: 38.5,
      carbs_g: 42,
      fat_g: 22.5,
      confidence: 0.87,
      thumbnailUri: 'file:///prepared/photo-3.jpg',
      loggedAt: 1_752_770_000_000,
    });
  });
});

describe('daily goals', () => {
  it('matches the spec constants', () => {
    expect(DAILY_GOALS).toEqual({
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 70,
    });
  });
});
