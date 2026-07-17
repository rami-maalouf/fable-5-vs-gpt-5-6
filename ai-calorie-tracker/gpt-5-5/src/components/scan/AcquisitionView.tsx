import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
  type NourishTheme,
} from "@/theme/tokens";

type AcquisitionViewProps = {
  preparationError: boolean;
  theme: NourishTheme;
  onChooseFromPhotos: () => void;
  onUseCamera: () => void;
};

export function AcquisitionView({
  preparationError,
  theme,
  onChooseFromPhotos,
  onUseCamera,
}: AcquisitionViewProps) {
  return (
    <View
      accessibilityLabel="Scan your meal. Choose a clear food photo or capture one with the rear camera."
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Scan your meal</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Choose a clear food photo or capture one with the rear camera. Nourish will prepare it
        before sending it for analysis.
      </Text>

      {preparationError ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>
          Could not prepare that photo.
        </Text>
      ) : null}

      <View style={styles.actionStack}>
        <Pressable
          accessibilityLabel="Choose from Photos"
          accessibilityHint="Opens the photo library"
          accessibilityRole="button"
          onPress={onChooseFromPhotos}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>
            Choose from Photos
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Use camera"
          accessibilityHint="Opens the rear camera"
          accessibilityRole="button"
          onPress={onUseCamera}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
            Use camera
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
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  error: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionStack: {
    gap: nourishSpacing.three,
  },
  primaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  primaryButtonText: {
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
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});
