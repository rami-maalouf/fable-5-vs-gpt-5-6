import { useEffect } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCalories, formatMacro } from "@/domain/nutrition";
import type { ScanSuccess } from "@/domain/scan-contract";
import { useNourishTheme } from "@/theme/tokens";

type ResultCardProps = {
  accepting: boolean;
  onAccept: () => void;
  onDiscard: () => void;
  result: ScanSuccess;
};

const macroFields = [
  { key: "protein_g", label: "Protein" },
  { key: "carbs_g", label: "Carbs" },
  { key: "fat_g", label: "Fat" },
] as const;

export function ResultCard({
  accepting,
  onAccept,
  onDiscard,
  result,
}: ResultCardProps) {
  const theme = useNourishTheme();
  const { fontScale } = useWindowDimensions();
  const useStackedLayout = fontScale >= 1.4;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${result.food}. ${formatCalories(result.calories)} calories. Estimate ready.`,
    );
  }, [result.calories, result.food]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            useStackedLayout && styles.compactCard,
            { backgroundColor: theme.surface },
          ]}
        >
          <Text
            accessibilityElementsHidden
            maxFontSizeMultiplier={1.4}
            style={[styles.eyebrow, { color: theme.coral }]}
          >
            AI ESTIMATE
          </Text>
          <View
            style={[styles.heading, useStackedLayout && styles.stackedSection]}
          >
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[styles.food, { color: theme.text }]}
            >
              {result.food}
            </Text>
            <View
              accessible
              accessibilityLabel={`${formatCalories(result.calories)} calories`}
              accessibilityRole="text"
              style={[
                styles.calories,
                useStackedLayout && styles.stackedCalories,
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.35}
                style={[styles.calorieValue, { color: theme.text }]}
              >
                {formatCalories(result.calories)}
              </Text>
              <Text
                maxFontSizeMultiplier={1.4}
                style={[styles.calorieLabel, { color: theme.textMuted }]}
              >
                calories
              </Text>
            </View>
          </View>

          <View
            style={[styles.macros, useStackedLayout && styles.stackedSection]}
          >
            {macroFields.map((field) => (
              <View
                accessible
                accessibilityLabel={`${field.label}, ${formatMacro(result[field.key])} grams`}
                accessibilityRole="text"
                key={field.key}
                style={[styles.macro, { backgroundColor: theme.background }]}
              >
                <Text
                  maxFontSizeMultiplier={1.4}
                  style={[styles.macroValue, { color: theme.text }]}
                >
                  {formatMacro(result[field.key])} g
                </Text>
                <Text
                  maxFontSizeMultiplier={1.4}
                  style={[styles.macroLabel, { color: theme.textMuted }]}
                >
                  {field.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Discard estimate"
              accessibilityRole="button"
              disabled={accepting}
              onPress={onDiscard}
              style={({ pressed }) => [
                styles.discardButton,
                {
                  borderColor: theme.border,
                  opacity: pressed || accepting ? 0.65 : 1,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.discardLabel, { color: theme.text }]}
              >
                Discard
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Accept estimate"
              accessibilityRole="button"
              accessibilityState={{ disabled: accepting }}
              disabled={accepting}
              onPress={onAccept}
              style={({ pressed }) => [
                styles.acceptButton,
                {
                  backgroundColor: pressed
                    ? theme.primaryPressed
                    : theme.primary,
                  opacity: accepting ? 0.65 : 1,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.acceptLabel, { color: theme.onAccent }]}
              >
                {accepting ? "Adding meal" : "Accept"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 14,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  card: {
    borderRadius: 28,
    padding: 20,
  },
  compactCard: {
    padding: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  heading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginTop: 7,
  },
  food: {
    flex: 1,
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  calories: {
    alignItems: "flex-end",
  },
  calorieValue: {
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 33,
  },
  calorieLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  macros: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  macro: {
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  macroValue: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  discardButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  discardLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  acceptButton: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1.6,
    justifyContent: "center",
    minHeight: 52,
  },
  acceptLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  stackedCalories: {
    alignItems: "flex-start",
  },
  stackedSection: {
    flexDirection: "column",
  },
});
