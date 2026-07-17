import { describe, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import HomeScreen from "../../app/(tabs)/index";
import type { Meal } from "../../src/domain/nutrition";
import { DayProvider } from "../../src/state/day-context";

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
}));

const fixtureMeals: Meal[] = [
  {
    id: "meal-1",
    food: "salmon rice bowl",
    calories: 900.4,
    protein_g: 60.2,
    carbs_g: 110.1,
    fat_g: 24.4,
    confidence: 0.92,
    thumbnailUri: "file:///salmon-rice-bowl.jpg",
    loggedAt: 1,
  },
  {
    id: "meal-2",
    food: "avocado toast",
    calories: 650.35,
    protein_g: 41.25,
    carbs_g: 80.45,
    fat_g: 20.3,
    confidence: 0.87,
    thumbnailUri: "file:///avocado-toast.jpg",
    loggedAt: 2,
  },
  {
    id: "meal-3",
    food: "berry yogurt",
    calories: 700.25,
    protein_g: 52.55,
    carbs_g: 75.45,
    fat_g: 29.6,
    confidence: 0.89,
    thumbnailUri: "file:///berry-yogurt.jpg",
    loggedAt: 3,
  },
];

async function renderDashboard(meals: readonly Meal[] = []) {
  await render(
    <DayProvider initialMeals={meals}>
      <HomeScreen />
    </DayProvider>,
  );
}

describe("Nourish dashboard", () => {
  test("renders the empty dashboard with goals, zero progress, and an accessible scan action", async () => {
    await renderDashboard();

    expect(screen.getByText("Nourish")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("2000")).toBeTruthy();
    expect(screen.getByText("calories left")).toBeTruthy();
    expect(screen.getByLabelText("calories progress: 0 percent")).toBeTruthy();
    expect(screen.getByText("0 / 150 g")).toBeTruthy();
    expect(screen.getByText("0 / 250 g")).toBeTruthy();
    expect(screen.getByText("0 / 70 g")).toBeTruthy();
    expect(screen.getByText("Your day is ready")).toBeTruthy();
    expect(screen.getByText("Scan a meal to start tracking today without manual entry.")).toBeTruthy();

    const scanButton = screen.getByLabelText("Scan a meal");
    const scanButtonStyle = StyleSheet.flatten(scanButton.props.style);

    expect(scanButton.props.accessibilityRole).toBe("button");
    expect(scanButtonStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(scanButtonStyle.minWidth).toBeGreaterThanOrEqual(44);
  });

  test("renders three fixture meals with exact totals, remaining values, and over-goal treatment", async () => {
    await renderDashboard(fixtureMeals);

    expect(screen.getByText("2251")).toBeTruthy();
    expect(screen.getByText("251 over target")).toBeTruthy();
    expect(screen.getByLabelText("calories progress: 100 percent")).toBeTruthy();
    expect(screen.getByText("154 / 150 g")).toBeTruthy();
    expect(screen.getByText("4 g over")).toBeTruthy();
    expect(screen.getByText("266 / 250 g")).toBeTruthy();
    expect(screen.getByText("16 g over")).toBeTruthy();
    expect(screen.getByText("74.3 / 70 g")).toBeTruthy();
    expect(screen.getByText("4.3 g over")).toBeTruthy();

    expect(screen.getByText("salmon rice bowl")).toBeTruthy();
    expect(screen.getByText("900 cal")).toBeTruthy();
    expect(screen.getByLabelText("salmon rice bowl, 900 calories, 60.2 grams protein, 110.1 grams carbs, 24.4 grams fat")).toBeTruthy();
    expect(screen.getByText("60.2p · 110.1c · 24.4f")).toBeTruthy();

    expect(screen.getByText("avocado toast")).toBeTruthy();
    expect(screen.getByText("650 cal")).toBeTruthy();
    expect(screen.getByLabelText("avocado toast, 650 calories, 41.3 grams protein, 80.5 grams carbs, 20.3 grams fat")).toBeTruthy();
    expect(screen.getByText("41.3p · 80.5c · 20.3f")).toBeTruthy();

    expect(screen.getByText("berry yogurt")).toBeTruthy();
    expect(screen.getByText("700 cal")).toBeTruthy();
    expect(screen.getByLabelText("berry yogurt, 700 calories, 52.6 grams protein, 75.5 grams carbs, 29.6 grams fat")).toBeTruthy();
    expect(screen.getByText("52.6p · 75.5c · 29.6f")).toBeTruthy();
  });
});
