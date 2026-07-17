import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Animated, Pressable, Text } from "react-native";

import HomeScreen from "../../app/(tabs)/index";
import type { Meal } from "../../src/domain/nutrition";
import { DayProvider, useDay } from "../../src/state/day-context";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("../../src/services/widget", () => ({
  publishRemainingCalories: jest.fn(),
}));

const rapidMeals: Meal[] = [
  {
    id: "rapid-1",
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
    id: "rapid-2",
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
    id: "rapid-3",
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

function RapidAcceptControls() {
  const day = useDay();

  return (
    <>
      {rapidMeals.map((meal, index) => (
        <Pressable
          accessibilityLabel={`accept rapid meal ${index + 1}`}
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

describe("nutrition motion", () => {
  let timingSpy: jest.SpiedFunction<typeof Animated.timing>;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, "timing").mockImplementation(() => {
      return {
        start: (callback?: Animated.EndCallback) => {
          queueMicrotask(() => {
            callback?.({ finished: true });
          });
        },
        stop: jest.fn(),
        reset: jest.fn(),
      } as unknown as Animated.CompositeAnimation;
    });
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  test("animates nutrition changes in the required window and settles rapid accepted meals exactly", async () => {
    await render(
      <DayProvider>
        <HomeScreen />
        <RapidAcceptControls />
      </DayProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText("accept rapid meal 1"));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("accept rapid meal 2"));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("accept rapid meal 3"));
    });

    await waitFor(() => {
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 550,
          useNativeDriver: false,
        }),
      );
    });
    expect(timingSpy).toHaveBeenCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        duration: 550,
        useNativeDriver: true,
      }),
    );
    expect(screen.getByText("510")).toBeTruthy();
    expect(screen.getByText("calories left")).toBeTruthy();
    expect(screen.getByLabelText("calories progress: 75 percent")).toBeTruthy();
    expect(screen.getByText("94 / 150 g")).toBeTruthy();
    expect(screen.getByText("146 / 250 g")).toBeTruthy();
    expect(screen.getByText("58 / 70 g")).toBeTruthy();
    expect(screen.getByText("3 logged")).toBeTruthy();
  });
});
