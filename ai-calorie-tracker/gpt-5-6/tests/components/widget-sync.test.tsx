import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import type { Meal } from "../../src/domain/nutrition";
import { DayProvider, useDay } from "../../src/state/day-context";
import { updateRemainingCaloriesWidget } from "../../src/services/widget";

jest.mock("../../src/services/widget", () => ({
  defaultCaloriesRemaining: 2_000,
  updateRemainingCaloriesWidget: jest.fn(),
}));

const meals: Meal[] = [
  {
    id: "widget-1",
    food: "Eggs",
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
    food: "Rice bowl",
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
    food: "Yogurt",
    calories: 410,
    protein_g: 28,
    carbs_g: 46,
    fat_g: 12,
    confidence: 0.88,
    thumbnailUri: "file:///yogurt.jpg",
    loggedAt: 3,
  },
];

function wrapper({ children }: PropsWithChildren) {
  return <DayProvider>{children}</DayProvider>;
}

describe("widget synchronization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("publishes cold state and every accepted meal from the dashboard selector", async () => {
    const { result } = await renderHook(() => useDay(), { wrapper });

    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(2_000);
    });

    for (const meal of meals) {
      await act(() => {
        expect(result.current.acceptMeal(meal)).toBe(true);
      });
      expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(
        result.current.summary.remaining.calories,
      );
    }

    expect(updateRemainingCaloriesWidget).toHaveBeenNthCalledWith(1, 2_000);
    expect(updateRemainingCaloriesWidget).toHaveBeenNthCalledWith(2, 1_680);
    expect(updateRemainingCaloriesWidget).toHaveBeenNthCalledWith(3, 920);
    expect(updateRemainingCaloriesWidget).toHaveBeenNthCalledWith(4, 510);
    expect(updateRemainingCaloriesWidget).toHaveBeenCalledTimes(4);
  });

  it("resets a stale prior snapshot on the next cold launch", async () => {
    const firstLaunch = await renderHook(() => useDay(), { wrapper });

    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(2_000);
    });

    await act(() => {
      expect(firstLaunch.result.current.acceptMeal(meals[0])).toBe(true);
    });
    expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(1_680);
    await firstLaunch.unmount();

    await renderHook(() => useDay(), { wrapper });
    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(2_000);
    });
  });
});
