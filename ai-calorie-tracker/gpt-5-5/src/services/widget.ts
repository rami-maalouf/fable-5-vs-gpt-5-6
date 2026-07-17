import { Platform } from "react-native";

import RemainingCaloriesWidget, {
  STATIC_WIDGET_REMAINING_CALORIES,
} from "../../widgets/RemainingCaloriesWidget";

export function publishStaticWidgetSnapshot(): void {
  publishRemainingCalories(STATIC_WIDGET_REMAINING_CALORIES);
}

export function publishRemainingCalories(remainingCalories: number): void {
  if (Platform.OS !== "ios") {
    return;
  }

  RemainingCaloriesWidget.updateSnapshot({
    remainingCalories: Math.round(remainingCalories),
  });
}
