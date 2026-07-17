import { Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, frame, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export const REMAINING_CALORIES_WIDGET_NAME = "RemainingCaloriesWidget";
export const STATIC_WIDGET_REMAINING_CALORIES = 2000;

export type RemainingCaloriesWidgetProps = {
  remainingCalories: number;
};

function RemainingCaloriesWidgetView(
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";

  const isDark = environment.colorScheme === "dark";
  const primaryColor = isDark ? "#FFF7F0" : "#2A2118";
  const secondaryColor = isDark ? "#D8C9BD" : "#7A6A5F";
  const accentColor = "#E8654A";

  return (
    <VStack
      alignment="leading"
      spacing={3}
      modifiers={[
        padding({ all: 14 }),
        frame({ maxWidth: 160, maxHeight: 160, alignment: "topLeading" }),
      ]}
    >
      <Text modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle(accentColor)]}>
        Nourish
      </Text>
      <Text
        modifiers={[
          font({ size: 34, weight: "bold", design: "rounded" }),
          foregroundStyle(primaryColor),
        ]}
      >
        {String(props.remainingCalories)}
      </Text>
      <Text modifiers={[font({ size: 12, weight: "medium" }), foregroundStyle(secondaryColor)]}>
        calories left
      </Text>
    </VStack>
  );
}

export default createWidget(REMAINING_CALORIES_WIDGET_NAME, RemainingCaloriesWidgetView);
