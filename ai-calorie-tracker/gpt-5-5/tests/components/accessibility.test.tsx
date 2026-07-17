import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Animated } from "react-native";

import { MealList } from "../../src/components/dashboard/MealList";
import { NutritionSummary } from "../../src/components/dashboard/NutritionSummary";
import { AnalyzingOverlay } from "../../src/components/scan/AnalyzingOverlay";
import { ErrorCard } from "../../src/components/scan/ErrorCard";
import { NourishStatusBar } from "../../src/components/system/NourishStatusBar";
import type { Meal } from "../../src/domain/nutrition";
import { getDaySummary } from "../../src/domain/nutrition";
import { ReducedMotionProvider } from "../../src/state/reduced-motion";
import { getNourishTheme } from "../../src/theme/tokens";

jest.mock("expo-status-bar", () => ({
  StatusBar: (props: { animated?: boolean; style?: string }) => {
    const React = require("react") as typeof import("react");
    const { Text } = require("react-native") as typeof import("react-native");

    return React.createElement(Text, {
      testID: "nourish-status-bar",
      children: JSON.stringify(props),
    });
  },
}));

const lightTheme = getNourishTheme("light");
const darkTheme = getNourishTheme("dark");

const meal: Meal = {
  id: "meal-1",
  food: "salmon rice bowl",
  calories: 900,
  protein_g: 60,
  carbs_g: 110,
  fat_g: 24,
  confidence: 0.92,
  thumbnailUri: "file:///salmon.jpg",
  loggedAt: 1,
};

describe("native accessibility polish", () => {
  let timingSpy: jest.SpiedFunction<typeof Animated.timing>;

  beforeEach(() => {
    jest.clearAllMocks();
    timingSpy = jest.spyOn(Animated, "timing").mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }) as unknown as Animated.CompositeAnimation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("declares an automatic animated status bar for live appearance changes", async () => {
    await render(<NourishStatusBar />);

    expect(screen.getByTestId("nourish-status-bar").children.join("")).toBe(
      JSON.stringify({ animated: true, style: "auto" }),
    );
  });

  test("exposes concise dashboard and meal summaries to assistive technology", async () => {
    await render(
      <ReducedMotionProvider initialPreference>
        <NutritionSummary summary={getDaySummary([meal])} theme={lightTheme} />
        <MealList meals={[meal]} theme={lightTheme} />
      </ReducedMotionProvider>,
    );

    expect(screen.getByLabelText("nutrition summary, 1100 calories left")).toBeTruthy();
    expect(screen.getByLabelText("Protein, 60 of 150 grams, 90 g left")).toBeTruthy();
    expect(screen.getByLabelText("salmon rice bowl, 900 calories, 60 grams protein, 110 grams carbs, 24 grams fat")).toBeTruthy();
    expect(screen.queryByLabelText("salmon rice bowl thumbnail")).toBeNull();
  });

  test("announces loading and error states with useful labels", async () => {
    await render(
      <>
        <AnalyzingOverlay theme={lightTheme} />
        <ErrorCard
          title="Connection problem"
          body="Nourish could not reach the analyzer."
          primaryLabel="Retry analysis"
          secondaryLabel="Close scan"
          theme={lightTheme}
          onPrimary={jest.fn()}
          onSecondary={jest.fn()}
        />
      </>,
    );

    expect(screen.getByLabelText("Analyzing meal photo").props.accessibilityLiveRegion).toBe("polite");
    expect(
      screen.getByLabelText("Connection problem. Nourish could not reach the analyzer.").props
        .accessibilityRole,
    ).toBe("alert");
    expect(screen.getByLabelText("Retry analysis").props.accessibilityHint).toBe(
      "Continues from this error state",
    );
  });

  test("honors reduced motion by landing animated nutrition and rows without timing", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);

    await render(
      <ReducedMotionProvider initialPreference>
        <NutritionSummary summary={getDaySummary([meal])} theme={lightTheme} />
        <MealList meals={[meal]} theme={lightTheme} />
      </ReducedMotionProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(timingSpy).not.toHaveBeenCalled();
  });

  test("keeps primary button text contrast above the normal-text threshold in both themes", () => {
    expect(contrastRatio(lightTheme.colors.accent, lightTheme.colors.onAccent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTheme.colors.accent, darkTheme.colors.onAccent)).toBeGreaterThanOrEqual(4.5);
  });
});

function contrastRatio(firstHex: string, secondHex: string): number {
  const first = relativeLuminance(firstHex);
  const second = relativeLuminance(secondHex);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function relativeLuminance(hex: string): number {
  const normalizedHex = hex.replace("#", "");
  const value = Number.parseInt(normalizedHex, 16);
  const channels = [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
