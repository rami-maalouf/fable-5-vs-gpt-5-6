import { router, type Href } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealList } from "@/components/dashboard/MealList";
import { NutritionSummary } from "@/components/dashboard/NutritionSummary";
import { useDay } from "@/state/day-context";
import {
  getNourishTheme,
  nourishFontScale,
  nourishLayout,
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
} from "@/theme/tokens";

export default function HomeScreen() {
  const day = useDay();
  const { fontScale } = useWindowDimensions();
  const theme = getNourishTheme(useColorScheme());
  const shouldPlaceScanInFlow = fontScale >= 1.35;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          accessibilityLabel="Today nutrition dashboard"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text
                maxFontSizeMultiplier={nourishFontScale.dense}
                style={[styles.wordmark, { color: theme.colors.accent }]}
              >
                Nourish
              </Text>
              <Text
                maxFontSizeMultiplier={nourishFontScale.dense}
                style={[styles.today, { color: theme.colors.textSecondary }]}
              >
                Today
              </Text>
            </View>
          </View>

          <NutritionSummary summary={day.summary} theme={theme} />
          <MealList meals={day.meals} theme={theme} />
          {shouldPlaceScanInFlow ? <ScanMealButton theme={theme} variant="inline" /> : null}
        </ScrollView>
      </SafeAreaView>

      {shouldPlaceScanInFlow ? null : <ScanMealButton theme={theme} variant="fixed" />}
    </View>
  );
}

function ScanMealButton({
  theme,
  variant,
}: {
  theme: ReturnType<typeof getNourishTheme>;
  variant: "fixed" | "inline";
}) {
  return (
    <Pressable
      accessibilityLabel="Scan a meal"
      accessibilityHint="Opens camera and photo library options for meal analysis"
      accessibilityRole="button"
      onPress={() => router.push("/scan" as Href)}
      style={[
        styles.scanButton,
        variant === "fixed" ? styles.scanButtonFixed : styles.scanButtonInline,
        {
          backgroundColor: theme.colors.accent,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={nourishFontScale.dense}
        style={[styles.scanButtonText, { color: theme.colors.onAccent }]}
      >
        Scan meal
      </Text>
    </Pressable>
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
    minWidth: 136,
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.five,
    paddingVertical: nourishSpacing.three,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  scanButtonFixed: {
    position: "absolute",
    right: nourishSpacing.five,
    bottom: nourishLayout.bottomTabInset + nourishSpacing.seven + nourishSpacing.two,
  },
  scanButtonInline: {
    alignSelf: "flex-end",
    marginTop: nourishSpacing.two,
    marginBottom: nourishSpacing.three,
  },
  scanButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
});
