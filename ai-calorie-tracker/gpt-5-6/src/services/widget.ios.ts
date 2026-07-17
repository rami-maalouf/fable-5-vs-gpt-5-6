import RemainingCaloriesWidget from "../../widgets/RemainingCaloriesWidget";

export const defaultCaloriesRemaining = 2_000;

export function updateRemainingCaloriesWidget(caloriesRemaining: number) {
  RemainingCaloriesWidget.updateSnapshot({
    caloriesRemaining: Math.round(caloriesRemaining),
  });
}
