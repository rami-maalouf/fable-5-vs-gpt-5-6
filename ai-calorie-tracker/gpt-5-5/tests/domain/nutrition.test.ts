import { describe, expect, test } from "@jest/globals";

import {
  DAILY_GOALS,
  clampProgress,
  getDaySummary,
  parseNutritionAnalysis,
  roundNutritionForDisplay,
  type Meal,
} from "../../src/domain/nutrition";

function meal(overrides: Partial<Meal>): Meal {
  return {
    id: "meal-1",
    food: "grain bowl",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    confidence: 0.9,
    thumbnailUri: "file:///meal.jpg",
    loggedAt: 1,
    ...overrides,
  };
}

describe("nutrition domain", () => {
  test("derives empty day totals from fixed goals", () => {
    expect(DAILY_GOALS).toEqual({
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 70,
    });

    expect(getDaySummary([])).toEqual({
      goals: DAILY_GOALS,
      consumed: {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      },
      remaining: DAILY_GOALS,
      progress: {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      },
    });
  });

  test("derives exact one-meal totals and remaining values including decimals", () => {
    const summary = getDaySummary([
      meal({
        calories: 515.25,
        protein_g: 37.35,
        carbs_g: 62.15,
        fat_g: 14.7,
      }),
    ]);

    expect(summary.consumed).toEqual({
      calories: 515.25,
      protein_g: 37.35,
      carbs_g: 62.15,
      fat_g: 14.7,
    });
    expect(summary.remaining).toEqual({
      calories: 1484.75,
      protein_g: 112.65,
      carbs_g: 187.85,
      fat_g: 55.3,
    });
    expect(summary.progress.calories).toBeCloseTo(0.257625);
  });

  test("derives exact three-meal totals and allows negative remaining values", () => {
    const summary = getDaySummary([
      meal({ id: "meal-1", calories: 900.4, protein_g: 60.2, carbs_g: 110.1, fat_g: 24.4 }),
      meal({ id: "meal-2", calories: 650.35, protein_g: 41.25, carbs_g: 80.45, fat_g: 20.3 }),
      meal({ id: "meal-3", calories: 700.25, protein_g: 52.55, carbs_g: 75.45, fat_g: 29.6 }),
    ]);

    expect(summary.consumed).toEqual({
      calories: 2251,
      protein_g: 154,
      carbs_g: 266,
      fat_g: 74.3,
    });
    expect(summary.remaining).toEqual({
      calories: -251,
      protein_g: -4,
      carbs_g: -16,
      fat_g: -4.3,
    });
    expect(summary.progress).toEqual({
      calories: 1,
      protein_g: 1,
      carbs_g: 1,
      fat_g: 1,
    });
  });

  test("clamps visual progress but does not hide arithmetic overages", () => {
    expect(clampProgress(-0.4)).toBe(0);
    expect(clampProgress(0.65)).toBe(0.65);
    expect(clampProgress(1.4)).toBe(1);
  });

  test("rounds display values without mutating exact totals", () => {
    expect(
      roundNutritionForDisplay({
        calories: 515.6,
        protein_g: 37.34,
        carbs_g: 62.15,
        fat_g: 14.04,
      }),
    ).toEqual({
      calories: 516,
      protein_g: 37.3,
      carbs_g: 62.2,
      fat_g: 14,
    });
  });

  test("validates successful and not-food analysis responses", () => {
    expect(
      parseNutritionAnalysis({
        food: "banana",
        calories: 105,
        protein_g: 1.3,
        carbs_g: 27,
        fat_g: 0.4,
        confidence: 0.99,
      }),
    ).toEqual({
      food: "banana",
      calories: 105,
      protein_g: 1.3,
      carbs_g: 27,
      fat_g: 0.4,
      confidence: 0.99,
    });

    expect(parseNutritionAnalysis({ error: "not_food" })).toEqual({ error: "not_food" });
  });

  test("rejects malformed, negative, non-finite, and out-of-range response data", () => {
    expect(parseNutritionAnalysis({ food: "", calories: 10 })).toBeNull();
    expect(
      parseNutritionAnalysis({
        food: "salad",
        calories: -1,
        protein_g: 10,
        carbs_g: 20,
        fat_g: 5,
        confidence: 0.8,
      }),
    ).toBeNull();
    expect(
      parseNutritionAnalysis({
        food: "salad",
        calories: Number.NaN,
        protein_g: 10,
        carbs_g: 20,
        fat_g: 5,
        confidence: 0.8,
      }),
    ).toBeNull();
    expect(
      parseNutritionAnalysis({
        food: "salad",
        calories: 10,
        protein_g: 10,
        carbs_g: 20,
        fat_g: 5,
        confidence: 1.1,
      }),
    ).toBeNull();
    expect(
      parseNutritionAnalysis({
        food: "salad",
        calories: 10001,
        protein_g: 10,
        carbs_g: 20,
        fat_g: 5,
        confidence: 0.8,
      }),
    ).toBeNull();
  });
});
