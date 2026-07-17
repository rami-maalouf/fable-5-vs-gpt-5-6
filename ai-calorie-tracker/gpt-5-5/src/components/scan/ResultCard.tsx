import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NutritionAnalysisSuccess } from "@/domain/nutrition";
import {
  type NourishTheme,
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
} from "@/theme/tokens";

export function ResultCard({
  result,
  isAccepting = false,
  onAccept,
  onDiscard,
  theme,
}: {
  result: NutritionAnalysisSuccess;
  isAccepting?: boolean;
  onAccept: () => void;
  onDiscard: () => void;
  theme: NourishTheme;
}) {
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <View
      accessibilityLabel={`Estimated result, ${result.food}, ${Math.round(
        result.calories,
      )} calories, ${Math.round(result.protein_g)} grams protein, ${Math.round(
        result.carbs_g,
      )} grams carbs, ${Math.round(result.fat_g)} grams fat, ${confidencePercent} percent confidence`}
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
          Estimated result
        </Text>
        <Text style={[styles.food, { color: theme.colors.textPrimary }]}>{result.food}</Text>
        <Text style={[styles.confidence, { color: theme.colors.textSecondary }]}>
          {confidencePercent}% confidence
        </Text>
      </View>

      <View style={styles.nutritionGrid}>
        <NutritionPill
          label={`${Math.round(result.calories)} cal`}
          theme={theme}
          tone={theme.colors.accentSoft}
        />
        <NutritionPill
          label={`${Math.round(result.protein_g)}g protein`}
          theme={theme}
          tone={theme.colors.proteinSoft}
        />
        <NutritionPill
          label={`${Math.round(result.carbs_g)}g carbs`}
          theme={theme}
          tone={theme.colors.carbsSoft}
        />
        <NutritionPill
          label={`${Math.round(result.fat_g)}g fat`}
          theme={theme}
          tone={theme.colors.fatSoft}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Discard food estimate"
          accessibilityHint="Closes without logging this estimate"
          accessibilityRole="button"
          disabled={isAccepting}
          onPress={onDiscard}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.textPrimary }]}>Discard</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Accept food estimate"
          accessibilityHint="Logs this estimate and returns to the dashboard"
          accessibilityRole="button"
          disabled={isAccepting}
          onPress={onAccept}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.primaryText, { color: theme.colors.onAccent }]}>
            {isAccepting ? "Logging..." : "Accept"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NutritionPill({
  label,
  tone,
  theme,
}: {
  label: string;
  tone: string;
  theme: NourishTheme;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: tone }]}>
      <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.five,
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  header: {
    gap: nourishSpacing.one,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  food: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  confidence: {
    fontSize: 14,
    fontWeight: "700",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: nourishSpacing.two,
  },
  pill: {
    borderRadius: nourishRadii.pill,
    paddingHorizontal: nourishSpacing.three,
    paddingVertical: nourishSpacing.two,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: nourishSpacing.three,
  },
  primaryButton: {
    flex: 1,
    minWidth: 132,
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 132,
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  primaryText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  secondaryText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
});
