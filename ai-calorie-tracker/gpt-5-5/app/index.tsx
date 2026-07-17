import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealList } from "@/components/dashboard/MealList";
import { NutritionSummary } from "@/components/dashboard/NutritionSummary";
import { useDay } from "@/state/day-context";
import {
  getNourishTheme,
  nourishLayout,
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
} from "@/theme/tokens";

export default function HomeScreen() {
  const day = useDay();
  const theme = getNourishTheme(useColorScheme());

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.wordmark, { color: theme.colors.accent }]}>Nourish</Text>
              <Text style={[styles.today, { color: theme.colors.textSecondary }]}>Today</Text>
            </View>
          </View>

          <NutritionSummary summary={day.summary} theme={theme} />
          <MealList meals={day.meals} theme={theme} />
        </ScrollView>
      </SafeAreaView>

      <Pressable
        accessibilityLabel="Scan a meal"
        accessibilityRole="button"
        onPress={() => undefined}
        style={[
          styles.scanButton,
          {
            backgroundColor: theme.colors.accent,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <Text style={[styles.scanButtonText, { color: theme.colors.onAccent }]}>Scan meal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
  },
  scroll: {
    width: "100%",
    maxWidth: nourishLayout.maxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: nourishSpacing.five,
    paddingTop: nourishSpacing.three,
    paddingBottom: nourishLayout.bottomTabInset + nourishSpacing.eight + nourishTouchTargets.primary,
    gap: nourishSpacing.five,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  today: {
    marginTop: nourishSpacing.one,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  scanButton: {
    position: "absolute",
    right: nourishSpacing.five,
    bottom: nourishLayout.bottomTabInset + nourishSpacing.seven + nourishSpacing.two,
    width: 136,
    minHeight: nourishTouchTargets.primary,
    minWidth: nourishTouchTargets.minimum,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: "900",
  },
});
