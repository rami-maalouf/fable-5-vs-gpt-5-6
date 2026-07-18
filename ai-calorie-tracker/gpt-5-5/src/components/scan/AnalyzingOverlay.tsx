import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  nourishFontScale,
  type NourishTheme,
  nourishRadii,
  nourishSpacing,
} from "@/theme/tokens";

export function AnalyzingOverlay({ theme }: { theme: NourishTheme }) {
  return (
    <View
      accessibilityLabel="Analyzing meal photo"
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <ActivityIndicator color={theme.colors.accent} />
      <Text
        maxFontSizeMultiplier={nourishFontScale.dense}
        style={[styles.title, { color: theme.colors.textPrimary }]}
      >
        Analyzing estimate
      </Text>
      <Text
        maxFontSizeMultiplier={nourishFontScale.dense}
        style={[styles.body, { color: theme.colors.textSecondary }]}
      >
        MacroLens is estimating calories and macros from this photo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.three,
    alignItems: "center",
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
});
