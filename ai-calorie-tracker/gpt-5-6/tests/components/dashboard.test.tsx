import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { DashboardView } from "../../app/index";
import { getDaySummary, type Meal } from "../../src/domain/nutrition";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("../../src/services/widget", () => ({
  updateRemainingCaloriesWidget: jest.fn(),
}));

const fixtureMeals: Meal[] = [
  {
    id: "meal-1",
    food: "Greek Yogurt Bowl",
    calories: 520,
    protein_g: 32.5,
    carbs_g: 68.2,
    fat_g: 14.1,
    confidence: 0.94,
    thumbnailUri: "file:///greek-yogurt.jpg",
    loggedAt: 1,
  },
  {
    id: "meal-2",
    food: "Chicken Rice Bowl",
    calories: 780,
    protein_g: 61.3,
    carbs_g: 92.4,
    fat_g: 18.7,
    confidence: 0.92,
    thumbnailUri: "file:///chicken-rice.jpg",
    loggedAt: 2,
  },
  {
    id: "meal-3",
    food: "Salmon Pasta",
    calories: 850,
    protein_g: 64.8,
    carbs_g: 101.6,
    fat_g: 42.5,
    confidence: 0.9,
    thumbnailUri: "file:///salmon-pasta.jpg",
    loggedAt: 3,
  },
];

describe("Nourish dashboard", () => {
  it("renders the empty day hierarchy and an accessible scan action", async () => {
    const screen = await render(
      <DashboardView
        meals={[]}
        summary={getDaySummary([])}
        onScan={jest.fn()}
      />,
    );

    expect(screen.getByText("NOURISH")).toBeOnTheScreen();
    expect(screen.getByText("Today")).toBeOnTheScreen();
    expect(screen.getByText("2000")).toBeOnTheScreen();
    expect(screen.getByText("calories left")).toBeOnTheScreen();
    expect(screen.getByText("Nothing logged yet")).toBeOnTheScreen();
    expect(screen.getByText("Protein")).toBeOnTheScreen();
    expect(screen.getByText("Carbs")).toBeOnTheScreen();
    expect(screen.getByText("Fat")).toBeOnTheScreen();

    expect(screen.getByText("Today")).toHaveProp("accessibilityRole", "header");
    expect(screen.getByText("Meals")).toHaveProp("accessibilityRole", "header");
    expect(screen.getByLabelText(/Calories: 0 of 2000 consumed/)).toHaveProp(
      "accessible",
      true,
    );
    expect(screen.getByLabelText(/Protein: 0 grams consumed/)).toHaveProp(
      "accessible",
      true,
    );
    expect(
      screen.getByText("Today").props.maxFontSizeMultiplier,
    ).toBeGreaterThanOrEqual(1.5);

    const scanButton = screen.getByRole("button", { name: "Scan food" });
    const buttonStyle = StyleSheet.flatten(scanButton.props.style);
    expect(buttonStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(buttonStyle.minWidth).toBeGreaterThanOrEqual(44);
  });

  it("renders exact over-goal arithmetic and all fixture meal details", async () => {
    const screen = await render(
      <DashboardView
        meals={fixtureMeals}
        summary={getDaySummary(fixtureMeals)}
        onScan={jest.fn()}
      />,
    );

    expect(screen.getByText("-150")).toBeOnTheScreen();
    expect(screen.getByText("2150 of 2000 kcal")).toBeOnTheScreen();
    expect(screen.getByText("158.6 g")).toBeOnTheScreen();
    expect(screen.getByText("8.6 g over")).toBeOnTheScreen();
    expect(screen.getByText("262.2 g")).toBeOnTheScreen();
    expect(screen.getByText("12.2 g over")).toBeOnTheScreen();
    expect(screen.getByText("75.3 g")).toBeOnTheScreen();
    expect(screen.getByText("5.3 g over")).toBeOnTheScreen();

    for (const meal of fixtureMeals) {
      expect(screen.getByText(meal.food)).toBeOnTheScreen();
      expect(screen.getByText(`${meal.calories} kcal`)).toBeOnTheScreen();
      expect(
        screen.getByLabelText(`${meal.food} thumbnail`, {
          includeHiddenElements: true,
        }),
      ).toBeOnTheScreen();
      expect(
        screen.getByLabelText(`${meal.food}, ${meal.calories} calories`),
      ).toHaveProp("accessible", true);
    }
  });
});
