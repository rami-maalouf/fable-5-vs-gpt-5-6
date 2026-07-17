import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealList } from "@/components/dashboard/MealList";
import { NutritionSummary } from "@/components/dashboard/NutritionSummary";
import type { DaySummary, Meal } from "@/domain/nutrition";
import { useDay } from "@/state/day-context";
import { useNourishTheme } from "@/theme/tokens";

type DashboardViewProps = {
  meals: readonly Meal[];
  summary: DaySummary;
  onScan: () => void;
};

export function DashboardView({ meals, summary, onScan }: DashboardViewProps) {
  const theme = useNourishTheme();
  const { fontScale } = useWindowDimensions();
  const layoutKey = `dashboard-font-scale-${fontScale}`;

  return (
    <View
      key={layoutKey}
      nativeID={layoutKey}
      style={[styles.screen, { backgroundColor: theme.background }]}
      testID="dashboard-layout"
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.wordmark, { color: theme.coral }]}>
              NOURISH
            </Text>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.6}
              style={[styles.today, { color: theme.text }]}
            >
              Today
            </Text>
          </View>

          <NutritionSummary summary={summary} />

          <View style={styles.mealsSection}>
            <View style={styles.sectionHeading}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.6}
                style={[styles.sectionTitle, { color: theme.text }]}
              >
                Meals
              </Text>
              <Text style={[styles.mealCount, { color: theme.textMuted }]}>
                {meals.length === 0
                  ? "No meals"
                  : `${meals.length} ${meals.length === 1 ? "meal" : "meals"}`}
              </Text>
            </View>
            <MealList meals={meals} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView
        edges={["bottom"]}
        pointerEvents="box-none"
        style={styles.scanDock}
      >
        <Pressable
          accessibilityLabel="Scan food"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onScan}
          style={({ pressed }) => [
            styles.scanButton,
            {
              backgroundColor: pressed ? theme.primaryPressed : theme.primary,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            style={[styles.scanGlyph, { borderColor: theme.onAccent }]}
          >
            <View
              style={[
                styles.scanGlyphLine,
                { backgroundColor: theme.onAccent },
              ]}
            />
          </View>
          <Text
            maxFontSizeMultiplier={1.5}
            style={[styles.scanLabel, { color: theme.onAccent }]}
          >
            Scan a meal
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

export default function HomeScreen() {
  const { meals, summary } = useDay();

  return (
    <DashboardView
      meals={meals}
      onScan={() => router.push("/scan")}
      summary={summary}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.1,
  },
  today: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.2,
    lineHeight: 41,
    marginTop: 3,
  },
  mealsSection: {
    marginTop: 32,
  },
  sectionHeading: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  mealCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  scanDock: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  scanButton: {
    alignItems: "center",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 58,
    minWidth: 58,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  scanGlyph: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    marginRight: 10,
    width: 22,
  },
  scanGlyphLine: {
    borderRadius: 2,
    height: 6,
    width: 6,
  },
  scanLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
});
