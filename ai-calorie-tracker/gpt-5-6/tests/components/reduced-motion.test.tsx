import { render, screen } from "@testing-library/react-native";

import { MealList } from "../../src/components/dashboard/MealList";
import { NutritionSummary } from "../../src/components/dashboard/NutritionSummary";
import { ScanOverlayTransition } from "../../src/components/scan/ScanOverlayTransition";
import { getDaySummary } from "../../src/domain/nutrition";
import { Text } from "react-native";

describe("reduced motion", () => {
  it("renders nutrition values without an entrance animation", async () => {
    await render(
      <NutritionSummary reduceMotionOverride summary={getDaySummary([])} />,
    );

    expect(screen.getByText("2000").props.entering).toBeUndefined();
    expect(screen.getByText("0 of 2000 kcal").props.entering).toBeUndefined();
    expect(screen.getAllByText("0 g")[0].props.entering).toBeUndefined();
  });

  it("renders new meal and scan content without entrance motion", async () => {
    await render(
      <>
        <MealList
          meals={[
            {
              id: "meal",
              food: "Meal",
              calories: 100,
              protein_g: 10,
              carbs_g: 10,
              fat_g: 2,
              confidence: 0.9,
              thumbnailUri: "file:///meal.jpg",
              loggedAt: 1,
            },
          ]}
          reduceMotionOverride
        />
        <ScanOverlayTransition reduceMotionOverride transitionKey="overlay">
          <Text>Overlay</Text>
        </ScanOverlayTransition>
      </>,
    );

    expect(
      screen.getByLabelText("Meal, 100 calories", {
        includeHiddenElements: true,
      }).props.entering,
    ).toBeUndefined();
    expect(screen.getByText("Overlay").parent?.props.entering).toBeUndefined();
  });
});
