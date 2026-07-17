import { StyleSheet, Text, View, type DimensionValue } from "react-native";

import {
  type DaySummary,
  type Nutrition,
  roundNutritionForDisplay,
} from "@/domain/nutrition";
import {
  nourishRadii,
  nourishSpacing,
  type NourishTheme,
} from "@/theme/tokens";

type NutritionSummaryProps = {
  summary: DaySummary;
  theme: NourishTheme;
};

type MacroKey = Exclude<keyof Nutrition, "calories">;

type MacroMetric = {
  key: MacroKey;
  label: string;
  color: string;
  softColor: string;
};

export function NutritionSummary({ summary, theme }: NutritionSummaryProps) {
  const displayConsumed = roundNutritionForDisplay(summary.consumed);
  const displayRemaining = roundNutritionForDisplay(summary.remaining);
  const calorieProgress = Math.round(summary.progress.calories * 100);
  const isOverCalories = summary.remaining.calories < 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.calorieRow}>
        <View
          accessibilityLabel={`calories progress: ${calorieProgress} percent`}
          style={[
            styles.ring,
            {
              borderColor: isOverCalories ? theme.colors.danger : theme.colors.accent,
              backgroundColor: theme.colors.accentSoft,
            },
          ]}
        >
          <View style={[styles.ringCore, { backgroundColor: theme.colors.surface }]} />
        </View>
        <View style={styles.calorieText}>
          <Text style={[styles.calorieNumber, { color: theme.colors.textPrimary }]}>
            {isOverCalories
              ? String(displayConsumed.calories)
              : String(Math.max(0, displayRemaining.calories))}
          </Text>
          <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>
            {isOverCalories ? "calories logged" : "calories left"}
          </Text>
          {isOverCalories ? (
            <Text style={[styles.overTarget, { color: theme.colors.danger }]}>
              {Math.abs(displayRemaining.calories)} over target
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.macroStack}>
        {getMacroMetrics(theme).map((metric) => (
          <MacroBar
            key={metric.key}
            metric={metric}
            consumed={displayConsumed[metric.key]}
            goal={summary.goals[metric.key]}
            remaining={displayRemaining[metric.key]}
            progress={summary.progress[metric.key]}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

function MacroBar({
  metric,
  consumed,
  goal,
  remaining,
  progress,
  theme,
}: {
  metric: MacroMetric;
  consumed: number;
  goal: number;
  remaining: number;
  progress: number;
  theme: NourishTheme;
}) {
  const width = `${Math.round(progress * 100)}%` as DimensionValue;

  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: theme.colors.textPrimary }]}>{metric.label}</Text>
        <Text style={[styles.macroValue, { color: theme.colors.textSecondary }]}>
          {formatGramValue(consumed)} / {formatGramValue(goal)} g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: metric.softColor }]}>
        <View style={[styles.fill, { width, backgroundColor: metric.color }]} />
      </View>
      <Text
        style={[
          styles.remaining,
          { color: remaining < 0 ? theme.colors.danger : theme.colors.textTertiary },
        ]}
      >
        {formatRemaining(remaining)}
      </Text>
    </View>
  );
}

function getMacroMetrics(theme: NourishTheme): MacroMetric[] {
  return [
    {
      key: "protein_g",
      label: "Protein",
      color: theme.colors.protein,
      softColor: theme.colors.proteinSoft,
    },
    {
      key: "carbs_g",
      label: "Carbs",
      color: theme.colors.carbs,
      softColor: theme.colors.carbsSoft,
    },
    {
      key: "fat_g",
      label: "Fat",
      color: theme.colors.fat,
      softColor: theme.colors.fatSoft,
    },
  ];
}

function formatRemaining(value: number): string {
  if (value < 0) {
    return `${formatGramValue(Math.abs(value))} g over`;
  }

  return `${formatGramValue(value)} g left`;
}

function formatGramValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.four,
    gap: nourishSpacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: nourishSpacing.four,
  },
  ring: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  calorieText: {
    flex: 1,
  },
  calorieNumber: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -2,
  },
  calorieLabel: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  overTarget: {
    marginTop: nourishSpacing.one,
    fontSize: 14,
    fontWeight: "700",
  },
  macroStack: {
    gap: nourishSpacing.two,
  },
  macroBlock: {
    gap: nourishSpacing.one,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: nourishSpacing.three,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  track: {
    height: 7,
    borderRadius: nourishRadii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: nourishRadii.pill,
  },
  remaining: {
    fontSize: 12,
    fontWeight: "700",
  },
});
