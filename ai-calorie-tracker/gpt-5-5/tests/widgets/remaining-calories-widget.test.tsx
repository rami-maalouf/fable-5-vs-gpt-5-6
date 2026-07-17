import { describe, expect, jest, test } from "@jest/globals";

import appConfig from "../../app.json";

const mockCreateWidget = jest.fn((name: string, component: unknown) => ({
  name,
  component,
  updateSnapshot: jest.fn(),
}));

jest.mock("expo-widgets", () => ({
  createWidget: mockCreateWidget,
}));

jest.mock("@expo/ui/swift-ui", () => ({
  Gauge: "Gauge",
  HStack: "HStack",
  Text: "Text",
  VStack: "VStack",
  ZStack: "ZStack",
}));

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  accessibilityElement: jest.fn((value: unknown) => ({ type: "accessibilityElement", value })),
  accessibilityLabel: jest.fn((value: unknown) => ({ type: "accessibilityLabel", value })),
  accessibilityValue: jest.fn((value: unknown) => ({ type: "accessibilityValue", value })),
  containerBackground: jest.fn((color: unknown, container: unknown) => ({
    type: "containerBackground",
    color,
    container,
  })),
  font: jest.fn((value: unknown) => ({ type: "font", value })),
  foregroundStyle: jest.fn((value: unknown) => ({ type: "foregroundStyle", value })),
  frame: jest.fn((value: unknown) => ({ type: "frame", value })),
  gaugeStyle: jest.fn((value: unknown) => ({ type: "gaugeStyle", value })),
  lineLimit: jest.fn((value: unknown) => ({ type: "lineLimit", value })),
  minimumScaleFactor: jest.fn((value: unknown) => ({ type: "minimumScaleFactor", value })),
  monospacedDigit: jest.fn(() => ({ type: "monospacedDigit" })),
  padding: jest.fn((value: unknown) => ({ type: "padding", value })),
  tint: jest.fn((value: unknown) => ({ type: "tint", value })),
  widgetAccentedRenderingMode: jest.fn((value: unknown) => ({
    type: "widgetAccentedRenderingMode",
    value,
  })),
}));

const {
  default: RemainingCaloriesWidget,
  getRemainingCaloriesWidgetModel,
  REMAINING_CALORIES_WIDGET_NAME,
  STATIC_WIDGET_REMAINING_CALORIES,
} = require("../../widgets/RemainingCaloriesWidget") as typeof import("../../widgets/RemainingCaloriesWidget");

type ExpoWidgetsPlugin = [
  "expo-widgets",
  {
    widgets: Array<{
      name: string;
      displayName: string;
      description: string;
      supportedFamilies: string[];
    }>;
  },
];

describe("remaining calories widget", () => {
  test("uses the exact widget name configured in app.json", () => {
    const widgetPlugin = appConfig.expo.plugins.find((plugin) => {
      return Array.isArray(plugin) && plugin[0] === "expo-widgets";
    }) as ExpoWidgetsPlugin | undefined;

    expect(widgetPlugin).toBeDefined();
    expect(widgetPlugin?.[1].widgets).toHaveLength(1);
    expect(widgetPlugin?.[1].widgets[0]).toMatchObject({
      name: REMAINING_CALORIES_WIDGET_NAME,
      displayName: "Nourish",
      supportedFamilies: ["systemSmall"],
    });
    expect(mockCreateWidget).toHaveBeenCalledWith(REMAINING_CALORIES_WIDGET_NAME, expect.any(String));
    expect((RemainingCaloriesWidget as unknown as { name: string }).name).toBe(
      REMAINING_CALORIES_WIDGET_NAME,
    );
  });

  test("keeps the serialized extension body self-contained", () => {
    const serializedWidget = mockCreateWidget.mock.calls[0]?.[1];

    expect(serializedWidget).toEqual(expect.any(String));
    expect(serializedWidget).not.toContain("getRemainingCaloriesWidgetModel");
    expect(serializedWidget).not.toContain("DAILY_CALORIE_GOAL");
    expect(serializedWidget).not.toContain("clamp(");
  });

  test("renders a known static remaining calorie value", () => {
    expect(STATIC_WIDGET_REMAINING_CALORIES).toBe(2000);
  });

  test("keeps final content constrained to the small widget requirements", () => {
    const model = getRemainingCaloriesWidgetModel(
      { remainingCalories: 1735 },
      {
        date: new Date(0),
        widgetFamily: "systemSmall",
        colorScheme: "light",
        widgetRenderingMode: "fullColor",
        configuration: undefined,
      },
    );

    expect(model).toMatchObject({
      remainingCalories: 1735,
      progress: 0.1325,
      headline: "Nourish",
      valueLabel: "1735",
      caption: "calories left",
      accessibilityLabel: "Nourish widget",
      accessibilityValue: "1735 calories left",
    });
    expect(model.shouldShowMacros).toBe(false);
    expect(model.shouldShowHistory).toBe(false);
    expect(model.shouldShowControls).toBe(false);
  });

  test("adapts visual tokens for dark and tinted widget rendering", () => {
    const darkModel = getRemainingCaloriesWidgetModel(
      { remainingCalories: 510 },
      {
        date: new Date(0),
        widgetFamily: "systemSmall",
        colorScheme: "dark",
        widgetRenderingMode: "fullColor",
        configuration: undefined,
      },
    );
    const tintedModel = getRemainingCaloriesWidgetModel(
      { remainingCalories: 510 },
      {
        date: new Date(0),
        widgetFamily: "systemSmall",
        colorScheme: "light",
        widgetRenderingMode: "accented",
        configuration: undefined,
      },
    );

    expect(darkModel.colors.background).toBe("#211915");
    expect(darkModel.colors.primaryText).toBe("#FFF7F0");
    expect(tintedModel.colors.background).toBe("#00000000");
    expect(tintedModel.colors.primaryText).toEqual({
      type: "hierarchical",
      style: "primary",
    });
    expect(tintedModel.usesAccentedRendering).toBe(true);
  });
});
