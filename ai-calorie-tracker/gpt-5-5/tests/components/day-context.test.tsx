import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { DAILY_GOALS, type Meal } from "../../src/domain/nutrition";
import { DayProvider, useDay } from "../../src/state/day-context";
import { publishRemainingCalories } from "../../src/services/widget";

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
}));

const sampleMeal: Meal = {
  id: "result-1",
  food: "grain bowl",
  calories: 640,
  protein_g: 34,
  carbs_g: 78,
  fat_g: 22,
  confidence: 0.88,
  thumbnailUri: "file:///prepared.jpg",
  loggedAt: 1,
};

function DayProbe() {
  const day = useDay();

  return (
    <>
      <Text testID="meal-count">{day.meals.length}</Text>
      <Text testID="goal-calories">{day.summary.goals.calories}</Text>
      <Text testID="remaining-calories">{day.summary.remaining.calories}</Text>
      <Text testID="remaining-protein">{day.summary.remaining.protein_g}</Text>
      <Pressable
        accessibilityLabel="accept meal"
        accessibilityRole="button"
        onPress={() => day.acceptMeal(sampleMeal)}
      >
        <Text>accept</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="discard result"
        accessibilityRole="button"
        onPress={() => day.discardResult(sampleMeal.id)}
      >
        <Text>discard</Text>
      </Pressable>
    </>
  );
}

async function renderDayProbe() {
  await render(
    <DayProvider>
      <DayProbe />
    </DayProvider>,
  );
}

describe("DayProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("starts empty, derives fixed goals, and publishes the default widget value", async () => {
    await renderDayProbe();

    expect(screen.getByTestId("meal-count").props.children).toBe(0);
    expect(screen.getByTestId("goal-calories").props.children).toBe(DAILY_GOALS.calories);
    expect(screen.getByTestId("remaining-calories").props.children).toBe(2000);

    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenCalledWith(2000);
    });
  });

  test("accepts a unique meal once and publishes the same remaining calories as selectors", async () => {
    await renderDayProbe();

    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenCalledWith(2000);
    });

    await fireEvent.press(screen.getByLabelText("accept meal"));

    expect(screen.getByTestId("meal-count").props.children).toBe(1);
    expect(screen.getByTestId("remaining-calories").props.children).toBe(1360);
    expect(screen.getByTestId("remaining-protein").props.children).toBe(116);

    await waitFor(() => {
      expect(publishRemainingCalories).toHaveBeenLastCalledWith(1360);
    });

    await fireEvent.press(screen.getByLabelText("accept meal"));
    await fireEvent.press(screen.getByLabelText("discard result"));

    expect(screen.getByTestId("meal-count").props.children).toBe(1);
    expect(screen.getByTestId("remaining-calories").props.children).toBe(1360);
    expect(publishRemainingCalories).toHaveBeenCalledTimes(2);
  });
});
