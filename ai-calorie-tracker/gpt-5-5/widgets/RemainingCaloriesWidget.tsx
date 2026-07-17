import { Gauge, HStack, Text, VStack } from "@expo/ui/swift-ui";
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
export const STATIC_WIDGET_REMAINING_CALORIES = 2000;
const DAILY_CALORIE_GOAL = 2000;

export type RemainingCaloriesWidgetProps = {
  remainingCalories: number;
};

type WidgetColorToken =
  | string
  | {
      type: "hierarchical";
      style: "primary" | "secondary" | "tertiary" | "quaternary";
    };

type RemainingCaloriesWidgetModel = {
  remainingCalories: number;
  progress: number;
  headline: string;
  valueLabel: string;
  caption: string;
  accessibilityLabel: string;
  accessibilityValue: string;
  usesAccentedRendering: boolean;
  shouldShowMacros: false;
  shouldShowHistory: false;
  shouldShowControls: false;
  colors: {
    background: string;
    primaryText: WidgetColorToken;
    secondaryText: WidgetColorToken;
    accent: string;
    ringTrack: string;
  };
};

function RemainingCaloriesWidgetView(
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";

  const remainingCalories = Math.round(props.remainingCalories);
  const dailyCalorieGoal = 2000;
  const consumedCalories = dailyCalorieGoal - remainingCalories;
  const rawProgress = consumedCalories / dailyCalorieGoal;
  const progress = Number.isFinite(rawProgress) ? Math.min(1, Math.max(0, rawProgress)) : 0;
  const isDark = environment.colorScheme === "dark";
  const isTinted =
    environment.widgetRenderingMode === "accented" ||
    environment.widgetRenderingMode === "vibrant";
  const colors = isTinted
    ? {
        background: "#00000000",
        primaryText: { type: "hierarchical", style: "primary" } as const,
        secondaryText: { type: "hierarchical", style: "secondary" } as const,
        accent: "#C8422D",
      }
    : {
        background: isDark ? "#211915" : "#FFFFFF",
        primaryText: isDark ? "#FFF7F0" : "#261A14",
        secondaryText: isDark ? "#D8C9BD" : "#6E5F54",
        accent: isDark ? "#FF7B5F" : "#C8422D",
      };
  const valueLabel = String(remainingCalories);
  const accessibilityValueText = `${remainingCalories} calories left`;

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[
        padding({ all: 14 }),
        frame({ maxWidth: 160, maxHeight: 160, alignment: "topLeading" }),
        containerBackground(colors.background, "widget"),
        accessibilityElement("ignore"),
        accessibilityLabel("Nourish widget"),
        accessibilityValue(accessibilityValueText),
      ]}
    >
      <HStack alignment="center" spacing={8}>
        <Gauge
          value={progress}
          min={0}
          max={1}
          modifiers={[
            frame({ width: 34, height: 34 }),
            gaugeStyle("circularCapacity"),
            tint(colors.accent),
          ]}
        />
        <Text
          modifiers={[
            font({ size: 14, weight: "bold", design: "rounded" }),
            foregroundStyle(colors.accent),
            lineLimit(1),
          ]}
        >
          Nourish
        </Text>
      </HStack>

      <Text
        modifiers={[
          font({ size: 40, weight: "bold", design: "rounded" }),
          foregroundStyle(colors.primaryText),
          monospacedDigit(),
          lineLimit(1),
          minimumScaleFactor(0.72),
        ]}
      >
        {valueLabel}
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: "semibold" }),
          foregroundStyle(colors.secondaryText),
          lineLimit(1),
          minimumScaleFactor(0.8),
        ]}
      >
        calories left
      </Text>
    </VStack>
  );
}

export function getRemainingCaloriesWidgetModel(
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
): RemainingCaloriesWidgetModel {
  const remainingCalories = Math.round(props.remainingCalories);
  const consumedCalories = DAILY_CALORIE_GOAL - remainingCalories;
  const progress = clamp(consumedCalories / DAILY_CALORIE_GOAL, 0, 1);
  const isDark = environment.colorScheme === "dark";
  const isTinted =
    environment.widgetRenderingMode === "accented" ||
    environment.widgetRenderingMode === "vibrant";

  return {
    remainingCalories,
    progress,
    headline: "Nourish",
    valueLabel: String(remainingCalories),
    caption: "calories left",
    accessibilityLabel: "Nourish widget",
    accessibilityValue: `${remainingCalories} calories left`,
    usesAccentedRendering: isTinted,
    shouldShowMacros: false,
    shouldShowHistory: false,
    shouldShowControls: false,
    colors: isTinted
      ? {
          background: "#00000000",
          primaryText: { type: "hierarchical", style: "primary" },
          secondaryText: { type: "hierarchical", style: "secondary" },
          accent: "#C8422D",
          ringTrack: "#00000000",
        }
      : {
          background: isDark ? "#211915" : "#FFFFFF",
          primaryText: isDark ? "#FFF7F0" : "#261A14",
          secondaryText: isDark ? "#D8C9BD" : "#6E5F54",
          accent: isDark ? "#FF7B5F" : "#C8422D",
          ringTrack: isDark ? "#4C261F" : "#FDE3D9",
        },
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export default createWidget(REMAINING_CALORIES_WIDGET_NAME, RemainingCaloriesWidgetView);
