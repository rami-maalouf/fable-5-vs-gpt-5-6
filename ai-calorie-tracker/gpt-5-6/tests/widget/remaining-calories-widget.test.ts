import appConfig from "../../app.json";

const mockCreateWidget = jest.fn();
const mockUpdateSnapshot = jest.fn();

jest.mock("@expo/ui/swift-ui", () => ({
  Gauge: "Gauge",
  HStack: "HStack",
  Spacer: "Spacer",
  Text: "Text",
  VStack: "VStack",
}));

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  accessibilityElement: jest.fn(),
  accessibilityLabel: jest.fn(),
  accessibilityValue: jest.fn(),
  containerBackground: jest.fn(),
  font: jest.fn(),
  foregroundStyle: jest.fn(),
  frame: jest.fn(),
  gaugeStyle: jest.fn(),
  lineLimit: jest.fn(),
  minimumScaleFactor: jest.fn(),
  monospacedDigit: jest.fn(),
  padding: jest.fn(),
  tint: jest.fn(),
}));

jest.mock("expo-widgets", () => ({
  createWidget: (...arguments_: unknown[]) => mockCreateWidget(...arguments_),
}));

mockCreateWidget.mockReturnValue({ updateSnapshot: mockUpdateSnapshot });

const {
  default: RemainingCaloriesWidget,
  getRemainingCaloriesWidgetModel,
  REMAINING_CALORIES_WIDGET_NAME,
} = require("../../widgets/RemainingCaloriesWidget") as typeof import("../../widgets/RemainingCaloriesWidget");
const { updateRemainingCaloriesWidget } =
  require("../../src/services/widget.ios") as typeof import("../../src/services/widget.ios");

const baseEnvironment = {
  date: new Date(0),
  widgetFamily: "systemSmall" as const,
  configuration: undefined,
};

describe("RemainingCaloriesWidget", () => {
  beforeEach(() => {
    mockUpdateSnapshot.mockClear();
  });

  it("registers exactly one small widget with the configured name", () => {
    const widgetPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-widgets",
    );

    expect(widgetPlugin).toEqual([
      "expo-widgets",
      expect.objectContaining({
        widgets: [
          expect.objectContaining({
            name: REMAINING_CALORIES_WIDGET_NAME,
            supportedFamilies: ["systemSmall"],
          }),
        ],
      }),
    ]);
    expect(mockCreateWidget).toHaveBeenCalledWith(
      REMAINING_CALORIES_WIDGET_NAME,
      expect.any(String),
    );
    expect(RemainingCaloriesWidget).toEqual({
      updateSnapshot: mockUpdateSnapshot,
    });
  });

  it("contains only the final mark, calorie value, label, and compact ring", () => {
    const serializedWidget = mockCreateWidget.mock.calls[0]?.[1];

    expect(serializedWidget).toEqual(expect.any(String));
    expect(serializedWidget).toContain("Gauge");
    expect(serializedWidget).toContain("NOURISH");
    expect(serializedWidget).toContain("calories left");
    expect(serializedWidget).not.toMatch(/macro|history|button|control/i);
  });

  it("derives matching light, dark, and tinted presentations", () => {
    const light = getRemainingCaloriesWidgetModel(
      { caloriesRemaining: 1_480 },
      {
        ...baseEnvironment,
        colorScheme: "light",
        widgetRenderingMode: "fullColor",
      },
    );
    const dark = getRemainingCaloriesWidgetModel(
      { caloriesRemaining: 1_480 },
      {
        ...baseEnvironment,
        colorScheme: "dark",
        widgetRenderingMode: "fullColor",
      },
    );
    const tinted = getRemainingCaloriesWidgetModel(
      { caloriesRemaining: 1_480 },
      {
        ...baseEnvironment,
        colorScheme: "light",
        widgetRenderingMode: "accented",
      },
    );

    expect(light).toMatchObject({
      caloriesRemaining: 1_480,
      progress: 0.26,
      headerSpacing: 12,
      brandLabel: "NOURISH",
      valueLabel: "1480",
      caption: "calories left",
      accessibilityValue: "1480 calories left",
      isTinted: false,
      colors: {
        background: "#FFF7F2",
        primary: "#2D211D",
      },
    });
    expect(dark.colors).toMatchObject({
      background: "#211916",
      primary: "#FFF8F4",
    });
    expect(tinted).toMatchObject({
      isTinted: true,
      colors: {
        background: "#00000000",
        primary: { type: "hierarchical", style: "primary" },
        secondary: { type: "hierarchical", style: "secondary" },
      },
    });
  });

  it("rounds the displayed value and clamps the compact ring progress", () => {
    const aboveGoal = getRemainingCaloriesWidgetModel(
      { caloriesRemaining: -149.6 },
      { ...baseEnvironment, colorScheme: "light" },
    );
    const untouched = getRemainingCaloriesWidgetModel(
      { caloriesRemaining: 2_400 },
      { ...baseEnvironment, colorScheme: "light" },
    );

    expect(aboveGoal).toMatchObject({
      caloriesRemaining: -150,
      progress: 1,
      valueLabel: "-150",
    });
    expect(untouched.progress).toBe(0);
  });

  it("publishes the same rounded value shown by the dashboard", () => {
    updateRemainingCaloriesWidget(1_419.6);

    expect(mockUpdateSnapshot).toHaveBeenCalledWith({
      caloriesRemaining: 1_420,
    });
  });
});
