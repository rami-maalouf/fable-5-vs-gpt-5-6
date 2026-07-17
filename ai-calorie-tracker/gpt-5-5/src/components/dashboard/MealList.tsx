import { useEffect, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

import {
  type Meal,
  roundNutritionForDisplay,
} from "@/domain/nutrition";
import { NUTRITION_MOTION_MS } from "@/components/dashboard/NutritionSummary";
import {
  nourishRadii,
  nourishSpacing,
  type NourishTheme,
} from "@/theme/tokens";

type MealListProps = {
  meals: readonly Meal[];
  theme: NourishTheme;
};

export function MealList({ meals, theme }: MealListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>Meals</Text>
        <Text style={[styles.sectionMeta, { color: theme.colors.textSecondary }]}>
          {meals.length === 0 ? "No meals yet" : `${meals.length} logged`}
        </Text>
      </View>

      {meals.length === 0 ? <EmptyMeals theme={theme} /> : meals.map((meal) => (
        <MealRow key={meal.id} meal={meal} theme={theme} />
      ))}
    </View>
  );
}

function EmptyMeals({ theme }: { theme: NourishTheme }) {
  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.emptyCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Your day is ready</Text>
      <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>
        Scan a meal to start tracking today without manual entry.
      </Text>
    </View>
  );
}

function MealRow({ meal, theme }: { meal: Meal; theme: NourishTheme }) {
  const displayMeal = roundNutritionForDisplay(meal);
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: NUTRITION_MOTION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [entrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        {
          opacity: entrance,
          transform: [{ translateY }],
        },
      ]}
    >
      <Image
        accessibilityLabel={`${meal.food} thumbnail`}
        source={{ uri: meal.thumbnailUri }}
        style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceSubtle }]}
      />
      <View style={styles.rowBody}>
        <Text style={[styles.mealName, { color: theme.colors.textPrimary }]}>{meal.food}</Text>
        <Text style={[styles.macroLine, { color: theme.colors.textSecondary }]}>
          {formatGramValue(displayMeal.protein_g)}p · {formatGramValue(displayMeal.carbs_g)}c ·{" "}
          {formatGramValue(displayMeal.fat_g)}f
        </Text>
      </View>
      <Text style={[styles.calories, { color: theme.colors.textPrimary }]}>
        {displayMeal.calories} cal
      </Text>
    </Animated.View>
  );
}

function formatGramValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    gap: nourishSpacing.two,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 22,
    fontWeight: "800",
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    alignItems: "center",
    gap: nourishSpacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  row: {
    borderWidth: 1,
    borderRadius: nourishRadii.medium,
    padding: nourishSpacing.two,
    flexDirection: "row",
    alignItems: "center",
    gap: nourishSpacing.two,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: nourishRadii.small,
  },
  rowBody: {
    flex: 1,
    gap: nourishSpacing.one,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "lowercase",
  },
  macroLine: {
    fontSize: 12,
    fontWeight: "700",
  },
  calories: {
    fontSize: 14,
    fontWeight: "800",
  },
});
