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

export type DaySummary = {
  consumed: Nutrition;
  remaining: Nutrition;
};

export const DAILY_GOALS = {
  calories: 2_000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 70,
} as const satisfies Nutrition;

export const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
};

const arithmeticPrecision = 1_000_000;

function stabilize(value: number) {
  return Math.round(value * arithmeticPrecision) / arithmeticPrecision;
}

export function addNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return {
    calories: stabilize(left.calories + right.calories),
    protein_g: stabilize(left.protein_g + right.protein_g),
    carbs_g: stabilize(left.carbs_g + right.carbs_g),
    fat_g: stabilize(left.fat_g + right.fat_g),
  };
}

export function subtractNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return {
    calories: stabilize(left.calories - right.calories),
    protein_g: stabilize(left.protein_g - right.protein_g),
    carbs_g: stabilize(left.carbs_g - right.carbs_g),
    fat_g: stabilize(left.fat_g - right.fat_g),
  };
}

export function getDaySummary(meals: readonly Meal[]): DaySummary {
  const consumed = meals.reduce<Nutrition>(addNutrition, EMPTY_NUTRITION);

  return {
    consumed,
    remaining: subtractNutrition(DAILY_GOALS, consumed),
  };
}

export function formatCalories(value: number) {
  return Math.round(value).toString();
}

export function formatMacro(value: number) {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return rounded.toFixed(1).replace(/\.0$/, '');
}

export function getProgress(consumed: number, goal: number) {
  if (goal <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, consumed / goal));
}
