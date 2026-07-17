import { Gauge, HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  accessibilityElement,
  accessibilityLabel,
  accessibilityValue,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export const REMAINING_CALORIES_WIDGET_NAME = "RemainingCaloriesWidget";

const dailyCalorieGoal = 2_000;

export type RemainingCaloriesWidgetProps = {
  caloriesRemaining: number;
};

type WidgetTextColor =
  | string
  | {
      type: "hierarchical";
      style: "primary" | "secondary";
    };

type RemainingCaloriesWidgetModel = {
  caloriesRemaining: number;
  progress: number;
  brandLabel: "NOURISH";
  valueLabel: string;
  caption: "calories left";
  accessibilityValue: string;
  isTinted: boolean;
  colors: {
    background: string;
    primary: WidgetTextColor;
    secondary: WidgetTextColor;
    accent: string;
  };
};

const RemainingCalories = (
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) => {
  "widget";

  const normalizedCalories = Number.isFinite(props.caloriesRemaining)
    ? Math.round(props.caloriesRemaining)
    : 2000;
  const rawProgress = (2000 - normalizedCalories) / 2000;
  const progress = Number.isFinite(rawProgress)
    ? Math.min(1, Math.max(0, rawProgress))
    : 0;
  const isDark = environment.colorScheme === "dark";
  const isTinted =
    environment.widgetRenderingMode === "accented" ||
    environment.widgetRenderingMode === "vibrant";
  const backgroundColor = isTinted
    ? "#00000000"
    : isDark
      ? "#211916"
      : "#FFF7F2";
  const primaryColor = isTinted
    ? ({ type: "hierarchical", style: "primary" } as const)
    : isDark
      ? "#FFF8F4"
      : "#2D211D";
  const secondaryColor = isTinted
    ? ({ type: "hierarchical", style: "secondary" } as const)
    : isDark
      ? "#D8C8C0"
      : "#75645B";
  const accentColor = isTinted ? "#FFFFFF" : isDark ? "#FF857A" : "#B84A42";
  const accessibilityValueText = `${normalizedCalories} calories left`;

  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        padding({ all: 2 }),
        containerBackground(backgroundColor, "widget"),
        accessibilityElement("ignore"),
        accessibilityLabel("Nourish widget"),
        accessibilityValue(accessibilityValueText),
      ]}
    >
      <HStack alignment="center" spacing={7}>
        <Gauge
          max={1}
          min={0}
          value={progress}
          modifiers={[
            frame({ width: 30, height: 30 }),
            gaugeStyle("circularCapacity"),
            tint(accentColor),
          ]}
        />
        <Text
          modifiers={[
            font({ size: 12, weight: "bold", design: "rounded" }),
            foregroundStyle(accentColor),
            lineLimit(1),
          ]}
        >
          NOURISH
        </Text>
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ size: 38, weight: "bold", design: "rounded" }),
          foregroundStyle(primaryColor),
          monospacedDigit(),
          lineLimit(1),
          minimumScaleFactor(0.7),
        ]}
      >
        {normalizedCalories}
      </Text>
      <Text
        modifiers={[
          font({ size: 12, weight: "semibold", design: "rounded" }),
          foregroundStyle(secondaryColor),
          lineLimit(1),
          minimumScaleFactor(0.8),
        ]}
      >
        calories left
      </Text>
    </VStack>
  );
};

export function getRemainingCaloriesWidgetModel(
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
): RemainingCaloriesWidgetModel {
  const caloriesRemaining = Number.isFinite(props.caloriesRemaining)
    ? Math.round(props.caloriesRemaining)
    : dailyCalorieGoal;
  const rawProgress = (dailyCalorieGoal - caloriesRemaining) / dailyCalorieGoal;
  const progress = Number.isFinite(rawProgress)
    ? Math.min(1, Math.max(0, rawProgress))
    : 0;
  const isDark = environment.colorScheme === "dark";
  const isTinted =
    environment.widgetRenderingMode === "accented" ||
    environment.widgetRenderingMode === "vibrant";

  return {
    caloriesRemaining,
    progress,
    brandLabel: "NOURISH",
    valueLabel: String(caloriesRemaining),
    caption: "calories left",
    accessibilityValue: `${caloriesRemaining} calories left`,
    isTinted,
    colors: isTinted
      ? {
          background: "#00000000",
          primary: { type: "hierarchical", style: "primary" },
          secondary: { type: "hierarchical", style: "secondary" },
          accent: "#FFFFFF",
        }
      : {
          background: isDark ? "#211916" : "#FFF7F2",
          primary: isDark ? "#FFF8F4" : "#2D211D",
          secondary: isDark ? "#D8C8C0" : "#75645B",
          accent: isDark ? "#FF857A" : "#B84A42",
        },
  };
}

export default createWidget(REMAINING_CALORIES_WIDGET_NAME, RemainingCalories);
