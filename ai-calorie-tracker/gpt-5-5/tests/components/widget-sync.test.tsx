import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type { Meal } from "../../src/domain/nutrition";
import { DayProvider, useDay } from "../../src/state/day-context";
import { publishRemainingCalories } from "../../src/services/widget";

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
}));

const sequentialMeals: Meal[] = [
  {
    id: "widget-1",
    food: "eggs",
    calories: 320,
    protein_g: 24,
    carbs_g: 4,
    fat_g: 22,
    confidence: 0.91,
    thumbnailUri: "file:///eggs.jpg",
    loggedAt: 1,
  },
  {
    id: "widget-2",
    food: "rice bowl",
    calories: 760,
    protein_g: 42,
    carbs_g: 96,
    fat_g: 24,
    confidence: 0.9,
    thumbnailUri: "file:///rice-bowl.jpg",
    loggedAt: 2,
  },
  {
    id: "widget-3",
    food: "yogurt",
    calories: 410,
    protein_g: 28,
    carbs_g: 46,
    fat_g: 12,
    confidence: 0.88,
    thumbnailUri: "file:///yogurt.jpg",
    loggedAt: 3,
  },
];

function WidgetSyncProbe() {
  const day = useDay();

  return (
    <>
      <Text testID="remaining-calories">{day.summary.remaining.calories}</Text>
      <Text testID="meal-count">{day.meals.length}</Text>
      {sequentialMeals.map((meal, index) => (
        <Pressable
          accessibilityLabel={`accept widget meal ${index + 1}`}
          accessibilityRole="button"
          key={meal.id}
          onPress={() => day.acceptMeal(meal)}
        >
          <Text>accept {index + 1}</Text>
        </Pressable>
      ))}
    </>
  );
}

describe("widget synchronization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("cold empty launch resets the widget and each accepted meal publishes selector-exact calories", async () => {
    await render(
      <DayProvider>
        <WidgetSyncProbe />
      </DayProvider>,
    );

    expect(screen.getByTestId("remaining-calories").props.children).toBe(2000);
    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenLastCalledWith(2000);
    });

    await fireEvent.press(screen.getByLabelText("accept widget meal 1"));
    expect(screen.getByTestId("remaining-calories").props.children).toBe(1680);
    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenLastCalledWith(1680);
    });

    await fireEvent.press(screen.getByLabelText("accept widget meal 2"));
    expect(screen.getByTestId("remaining-calories").props.children).toBe(920);
    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenLastCalledWith(920);
    });

    await fireEvent.press(screen.getByLabelText("accept widget meal 3"));
    expect(screen.getByTestId("remaining-calories").props.children).toBe(510);
    expect(screen.getByTestId("meal-count").props.children).toBe(3);
    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenLastCalledWith(510);
    });

    expect(publishRemainingCalories).toHaveBeenNthCalledWith(1, 2000);
    expect(publishRemainingCalories).toHaveBeenNthCalledWith(2, 1680);
    expect(publishRemainingCalories).toHaveBeenNthCalledWith(3, 920);
    expect(publishRemainingCalories).toHaveBeenNthCalledWith(4, 510);
    expect(publishRemainingCalories).toHaveBeenCalledTimes(4);
  });
});
