import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";

const mockUpdateSnapshot = jest.fn();

jest.mock("../../widgets/RemainingCaloriesWidget", () => ({
  __esModule: true,
  STATIC_WIDGET_REMAINING_CALORIES: 2000,
  default: {
    updateSnapshot: mockUpdateSnapshot,
  },
}));

const {
  publishRemainingCalories,
  publishStaticWidgetSnapshot,
} = require("@/services/widget") as typeof import("@/services/widget");
const {
  default: RemainingCaloriesWidget,
  STATIC_WIDGET_REMAINING_CALORIES,
} = require("../../widgets/RemainingCaloriesWidget") as typeof import("../../widgets/RemainingCaloriesWidget");

describe("widget snapshot service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "ios");
  });

  test("publishes the static calories remaining snapshot on ios", () => {
    publishStaticWidgetSnapshot();

    expect(mockUpdateSnapshot).toHaveBeenCalledWith({
      remainingCalories: STATIC_WIDGET_REMAINING_CALORIES,
    });
  });

  test("rounds explicit remaining calories before snapshot updates", () => {
    publishRemainingCalories(1734.6);

    expect(mockUpdateSnapshot).toHaveBeenCalledWith({
      remainingCalories: 1735,
    });
  });

  test("does not update native widgets on non-ios platforms", () => {
    jest.replaceProperty(Platform, "OS", "android");

    publishRemainingCalories(1200);

    expect(RemainingCaloriesWidget.updateSnapshot).not.toHaveBeenCalled();
  });
});
