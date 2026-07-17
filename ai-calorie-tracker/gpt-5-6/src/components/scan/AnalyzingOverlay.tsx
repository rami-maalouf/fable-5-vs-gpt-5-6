import { useEffect } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { useNourishTheme } from "@/theme/tokens";

type AnalyzingOverlayProps = {
  onClose?: () => void;
  subtitle?: string;
  title?: string;
  reduceMotionOverride?: boolean;
};

export function AnalyzingOverlay({
  onClose,
  subtitle = "Estimating calories and macros",
  title = "Analyzing your meal",
  reduceMotionOverride,
}: AnalyzingOverlayProps) {
  const theme = useNourishTheme();
  const systemReduceMotion = useReducedMotion();
  const reduceMotion = reduceMotionOverride ?? systemReduceMotion;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${title}. ${subtitle}`);
  }, [subtitle, title]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {onClose && (
        <Pressable
          accessibilityLabel="Close scanner"
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.surface }]}
        >
          <View
            style={[
              styles.closeLine,
              styles.closeLeft,
              { backgroundColor: theme.text },
            ]}
          />
          <View
            style={[
              styles.closeLine,
              styles.closeRight,
              { backgroundColor: theme.text },
            ]}
          />
        </Pressable>
      )}
      <View
        accessible
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        style={[styles.card, { backgroundColor: theme.surface }]}
      >
        {reduceMotion ? (
          <View
            testID="analysis-status-marker"
            style={[styles.statusMarker, { backgroundColor: theme.coral }]}
          />
        ) : (
          <ActivityIndicator
            color={theme.coral}
            size="small"
            testID="analysis-spinner"
          />
        )}
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  closeButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  closeLine: {
    borderRadius: 2,
    height: 2,
    position: "absolute",
    width: 18,
  },
  closeLeft: {
    transform: [{ rotate: "45deg" }],
  },
  closeRight: {
    transform: [{ rotate: "-45deg" }],
  },
  card: {
    alignItems: "center",
    borderRadius: 24,
    flexDirection: "row",
    minHeight: 88,
    paddingHorizontal: 20,
  },
  copy: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statusMarker: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
