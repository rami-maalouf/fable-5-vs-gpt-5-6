// bottom error card layered over the still-mounted meal photo. two distinct
// recovery surfaces: not-food routes back to acquisition for a new photo,
// while recoverable analysis and network failures retry the same prepared
// image. pure presentation: copy and callbacks only, no fetching or state.
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontScaleCap, motion, radius, spacing, typeScale } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useThemeColors } from '@/theme/use-theme-colors';

export type ErrorVariant = 'not_food' | 'analysis' | 'network';

type ErrorCopy = {
  headline: string;
  body: string;
  primaryLabel: string;
};

// honest copy: not-food asks for a different photo; the recoverable pair
// distinguishes transport problems from analysis problems so the user knows
// whether to check the connection or simply retry the same image
const COPY: Record<ErrorVariant, ErrorCopy> = {
  not_food: {
    headline: "That doesn't look like food",
    body: 'No meal was recognized in this photo. Try a clearer shot of your food.',
    primaryLabel: 'Try another photo',
  },
  network: {
    headline: "Couldn't reach the analyzer",
    body: 'Check your connection, then retry with the same photo.',
    primaryLabel: 'Retry analysis',
  },
  analysis: {
    headline: 'Analysis failed',
    body: 'The analyzer could not finish this time. Retry with the same photo.',
    primaryLabel: 'Retry analysis',
  },
};

type ErrorCardProps = {
  variant: ErrorVariant;
  // not-food: return to acquisition; analysis/network: retry the same image
  onPrimaryAction: () => void;
  onDiscard: () => void;
};

export function ErrorCard({
  variant,
  onPrimaryAction,
  onDiscard,
}: ErrorCardProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const copy = COPY[variant];
  // stable animated node; useState initializer keeps it off the ref rule
  const [entrance] = useState(() => new Animated.Value(0));

  // same layered pattern as the result card: one short fade/translate
  // entrance; reduce-motion users get opacity only
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: motion.standard,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  // the stage scrim dims the photo behind the card so the pause reads
  // clearly in both themes while the prepared photo stays visible context
  const scrimOpacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.stageScrim, opacity: scrimOpacity },
        ]}
      />
      <Animated.View
        testID="error-card"
        accessibilityLiveRegion="polite"
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            bottom: insets.bottom + spacing.lg,
            opacity: entrance,
          },
          // the transform key must be absent (not undefined) under reduce
          // motion or the native animated validator rejects the style
          reducedMotion ? null : { transform: [{ translateY }] },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[styles.headline, { color: colors.textPrimary }]}
        >
          {copy.headline}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {copy.body}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard"
            onPress={onDiscard}
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor: colors.surfaceMuted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={fontScaleCap.pill}
              style={[styles.actionText, { color: colors.textPrimary }]}
            >
              Discard
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.primaryLabel}
            onPress={onPrimaryAction}
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor: colors.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={fontScaleCap.pill}
              style={[styles.actionText, { color: colors.onAccent }]}
            >
              {copy.primaryLabel}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.md,
  },
  headline: {
    ...typeScale.title,
  },
  body: {
    ...typeScale.body,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typeScale.bodyStrong,
  },
});
