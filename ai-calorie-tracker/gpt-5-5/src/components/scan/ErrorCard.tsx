import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  getNourishTheme,
  nourishFontScale,
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
} from "@/theme/tokens";

type ErrorCardProps = {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  theme: ReturnType<typeof getNourishTheme>;
  onPrimary: () => void;
  onSecondary: () => void;
};

export function ErrorCard({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  theme,
  onPrimary,
  onSecondary,
}: ErrorCardProps) {
  return (
    <View
      accessibilityLabel={`${title}. ${body}`}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <Text
        maxFontSizeMultiplier={nourishFontScale.dense}
        style={[styles.title, { color: theme.colors.textPrimary }]}
      >
        {title}
      </Text>
      <Text
        maxFontSizeMultiplier={nourishFontScale.dense}
        style={[styles.body, { color: theme.colors.textSecondary }]}
      >
        {body}
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={primaryLabel}
          accessibilityHint="Continues from this error state"
          accessibilityRole="button"
          onPress={onPrimary}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text
            maxFontSizeMultiplier={nourishFontScale.dense}
            style={[styles.primaryText, { color: theme.colors.onAccent }]}
          >
            {primaryLabel}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel={secondaryLabel}
          accessibilityHint="Closes without logging a meal"
          accessibilityRole="button"
          onPress={onSecondary}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            maxFontSizeMultiplier={nourishFontScale.dense}
            style={[styles.secondaryText, { color: theme.colors.textPrimary }]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.four,
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    gap: nourishSpacing.three,
  },
  primaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  primaryText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  secondaryText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});
