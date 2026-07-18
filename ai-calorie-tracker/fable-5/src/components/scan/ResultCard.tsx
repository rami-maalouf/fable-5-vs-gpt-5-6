// bottom result card layered over the still-mounted meal photo. pure
// presentation: receives the validated result and callbacks, never fetches
// or parses ai output. confidence is stored upstream but not promoted here.
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

import type { ScanSuccess } from '@/domain/scan-contract';
import { formatCalories, formatGrams } from '@/domain/nutrition';
import { fontScaleCap, motion, radius, spacing, typeScale } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { ColorTokens } from '@/theme/tokens';

type ResultCardProps = {
  result: ScanSuccess;
  accepted: boolean;
  onAccept: () => void;
  onDiscard: () => void;
};

type MacroCellProps = {
  label: string;
  grams: number;
  dotColor: string;
  colors: ColorTokens;
};

function MacroCell({ label, grams, dotColor, colors }: MacroCellProps) {
  return (
    <View
      style={styles.macroCell}
      accessible
      accessibilityLabel={`${label} ${formatGrams(grams)} grams`}
    >
      <View style={styles.macroHeader}>
        <View style={[styles.macroDot, { backgroundColor: dotColor }]} />
        <Text
          maxFontSizeMultiplier={fontScaleCap.dense}
          style={[styles.macroLabel, { color: colors.textSecondary }]}
        >
          {label}
        </Text>
      </View>
      <Text
        maxFontSizeMultiplier={fontScaleCap.dense}
        style={[styles.macroValue, { color: colors.textPrimary }]}
      >
        {formatGrams(grams)}g
      </Text>
    </View>
  );
}

export function ResultCard({
  result,
  accepted,
  onAccept,
  onDiscard,
}: ResultCardProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // stable animated node; useState initializer keeps it off the ref rule
  const [entrance] = useState(() => new Animated.Value(0));

  // one short fade/translate entrance; reduce-motion users get opacity only
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

  return (
    <Animated.View
      testID="result-card"
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
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            AI estimate
          </Text>
        </View>
      </View>

      <Text
        accessibilityRole="header"
        numberOfLines={2}
        maxFontSizeMultiplier={fontScaleCap.pill}
        style={[styles.foodName, { color: colors.textPrimary }]}
      >
        {result.food}
      </Text>

      <View
        accessible
        accessibilityLabel={`${formatCalories(result.calories)} estimated calories`}
        style={styles.calorieRow}
      >
        <Text
          maxFontSizeMultiplier={fontScaleCap.display}
          style={[styles.calorieValue, { color: colors.textPrimary }]}
        >
          {formatCalories(result.calories)}
        </Text>
        <Text
          maxFontSizeMultiplier={fontScaleCap.dense}
          style={[styles.calorieUnit, { color: colors.textSecondary }]}
        >
          estimated calories
        </Text>
      </View>

      <View style={styles.macroRow}>
        <MacroCell
          label="Protein"
          grams={result.protein_g}
          dotColor={colors.protein}
          colors={colors}
        />
        <MacroCell
          label="Carbs"
          grams={result.carbs_g}
          dotColor={colors.carbs}
          colors={colors}
        />
        <MacroCell
          label="Fat"
          grams={result.fat_g}
          dotColor={colors.fat}
          colors={colors}
        />
      </View>

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
          accessibilityLabel="Accept"
          accessibilityState={{ disabled: accepted }}
          disabled={accepted}
          onPress={onAccept}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: colors.accent,
              opacity: accepted ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            maxFontSizeMultiplier={fontScaleCap.pill}
            style={[styles.actionText, { color: colors.onAccent }]}
          >
            Accept
          </Text>
        </Pressable>
      </View>
    </Animated.View>
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
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...typeScale.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  foodName: {
    ...typeScale.title,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  calorieValue: {
    ...typeScale.largeTitle,
    fontVariant: ['tabular-nums'],
  },
  calorieUnit: {
    ...typeScale.label,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  macroCell: {
    flex: 1,
    gap: spacing.xs,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  macroLabel: {
    ...typeScale.label,
  },
  macroValue: {
    ...typeScale.bodyStrong,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
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
