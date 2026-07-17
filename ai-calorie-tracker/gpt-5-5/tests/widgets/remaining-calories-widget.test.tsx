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
  Text: "Text",
  VStack: "VStack",
}));

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  font: jest.fn((value: unknown) => ({ type: "font", value })),
  foregroundStyle: jest.fn((value: unknown) => ({ type: "foregroundStyle", value })),
  frame: jest.fn((value: unknown) => ({ type: "frame", value })),
  padding: jest.fn((value: unknown) => ({ type: "padding", value })),
}));

const {
  default: RemainingCaloriesWidget,
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

  test("renders a known static remaining calorie value", () => {
    expect(STATIC_WIDGET_REMAINING_CALORIES).toBe(2000);
  });
});
