export type Nutrition = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type NutritionAnalysisSuccess = Nutrition & {
  food: string;
  confidence: number;
};

export type NutritionAnalysisNotFood = {
  error: "not_food";
};

export type NutritionAnalysis = NutritionAnalysisSuccess | NutritionAnalysisNotFood;

export type Meal = NutritionAnalysisSuccess & {
  id: string;
  thumbnailUri: string;
  loggedAt: number;
};

export type DaySummary = {
  goals: Nutrition;
  consumed: Nutrition;
  remaining: Nutrition;
  progress: Nutrition;
};

export const DAILY_GOALS: Nutrition = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 70,
};

export const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
};

const MAX_ANALYSIS_NUTRITION: Nutrition = {
  calories: 10000,
  protein_g: 1000,
  carbs_g: 1000,
  fat_g: 1000,
};

export function getDaySummary(meals: readonly Meal[]): DaySummary {
  const consumed = meals.reduce<Nutrition>((total, currentMeal) => {
    return addNutrition(total, currentMeal);
  }, EMPTY_NUTRITION);
  const remaining = subtractNutrition(DAILY_GOALS, consumed);

  return {
    goals: DAILY_GOALS,
    consumed,
    remaining,
    progress: {
      calories: clampProgress(consumed.calories / DAILY_GOALS.calories),
      protein_g: clampProgress(consumed.protein_g / DAILY_GOALS.protein_g),
      carbs_g: clampProgress(consumed.carbs_g / DAILY_GOALS.carbs_g),
      fat_g: clampProgress(consumed.fat_g / DAILY_GOALS.fat_g),
    },
  };
}

export function addNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return {
    calories: normalizeNumber(left.calories + right.calories),
    protein_g: normalizeNumber(left.protein_g + right.protein_g),
    carbs_g: normalizeNumber(left.carbs_g + right.carbs_g),
    fat_g: normalizeNumber(left.fat_g + right.fat_g),
  };
}

export function subtractNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return {
    calories: normalizeNumber(left.calories - right.calories),
    protein_g: normalizeNumber(left.protein_g - right.protein_g),
    carbs_g: normalizeNumber(left.carbs_g - right.carbs_g),
    fat_g: normalizeNumber(left.fat_g - right.fat_g),
  };
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function roundNutritionForDisplay(nutrition: Nutrition): Nutrition {
  return {
    calories: Math.round(nutrition.calories),
    protein_g: roundToOneDecimal(nutrition.protein_g),
    carbs_g: roundToOneDecimal(nutrition.carbs_g),
    fat_g: roundToOneDecimal(nutrition.fat_g),
  };
}

export function parseNutritionAnalysis(value: unknown): NutritionAnalysis | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.error === "not_food") {
    return { error: "not_food" };
  }

  if (
    typeof value.food !== "string" ||
    value.food.trim().length === 0 ||
    !isValidNutritionValue(value.calories, MAX_ANALYSIS_NUTRITION.calories) ||
    !isValidNutritionValue(value.protein_g, MAX_ANALYSIS_NUTRITION.protein_g) ||
    !isValidNutritionValue(value.carbs_g, MAX_ANALYSIS_NUTRITION.carbs_g) ||
    !isValidNutritionValue(value.fat_g, MAX_ANALYSIS_NUTRITION.fat_g) ||
    !isConfidence(value.confidence)
  ) {
    return null;
  }

  return {
    food: value.food.trim(),
    calories: value.calories,
    protein_g: value.protein_g,
    carbs_g: value.carbs_g,
    fat_g: value.fat_g,
    confidence: value.confidence,
  };
}

function isValidNutritionValue(value: unknown, maxValue: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maxValue;
}

function isConfidence(value: unknown): value is number {
  return isValidNutritionValue(value, 1);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeNumber(value: number): number {
  return Math.round(value * 1_000_000_000) / 1_000_000_000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
