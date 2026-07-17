// pure nutrition rules: types, fixed goals, derived totals, and display
// formatting. no react, expo, or widget imports.
import type { ScanSuccess } from './scan-contract';

export type Nutrition = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Meal = Nutrition & {
  id: string;
  food: string;
  confidence: number;
  thumbnailUri: string;
  loggedAt: number;
};

export const DAILY_GOALS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 70,
} as const;

export const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
};

export type DaySummary = {
  consumed: Nutrition;
  remaining: Nutrition;
};

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories + b.calories,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
  };
}

export function subtractNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories - b.calories,
    protein_g: a.protein_g - b.protein_g,
    carbs_g: a.carbs_g - b.carbs_g,
    fat_g: a.fat_g - b.fat_g,
  };
}

// totals are derived from the meal list, never synchronized by effects
export function getDaySummary(meals: readonly Meal[]): DaySummary {
  const consumed = meals.reduce<Nutrition>(
    (total, meal) => addNutrition(total, meal),
    EMPTY_NUTRITION,
  );

  return {
    consumed,
    remaining: subtractNutrition(DAILY_GOALS, consumed),
  };
}

export function createMeal(
  result: ScanSuccess,
  id: string,
  thumbnailUri: string,
  loggedAt: number,
): Meal {
  return {
    id,
    food: result.food,
    calories: result.calories,
    protein_g: result.protein_g,
    carbs_g: result.carbs_g,
    fat_g: result.fat_g,
    confidence: result.confidence,
    thumbnailUri,
    loggedAt,
  };
}

// calories display as whole numbers
export function formatCalories(value: number): string {
  return String(Math.round(value));
}

// macro grams display to at most one decimal place
export function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

// remaining values can be negative, but visual progress is clamped to 0..1
export function clampProgress(consumed: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, consumed / goal));
}
