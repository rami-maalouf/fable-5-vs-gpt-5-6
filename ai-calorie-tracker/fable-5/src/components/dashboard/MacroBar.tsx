// one macro progress bar with consumed and remaining labels. over-goal
// values keep the bar full and switch the remaining label to the over color.
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { clampProgress, formatGrams } from '@/domain/nutrition';
import { motion, radius, spacing, typeScale } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useThemeColors } from '@/theme/use-theme-colors';

type MacroBarProps = {
  label: string;
  consumed: number;
  goal: number;
  color: string;
};

export function MacroBar({ label, consumed, goal, color }: MacroBarProps) {
  const colors = useThemeColors();
  const progress = clampProgress(consumed, goal);
  const remaining = goal - consumed;
  const isOver = remaining < 0;

  const reducedMotion = useReducedMotion();
  const [animatedProgress] = useState(() => new Animated.Value(progress));

  // same contract as the calorie ring: animate from the previously displayed
  // fill to the state-derived target over the shared settle duration so all
  // four indicators land together; reduce-motion updates immediately
  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.stopAnimation();
      animatedProgress.setValue(progress);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      toValue: progress,
      duration: motion.settle,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, progress, reducedMotion]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const accessibilityLabel = isOver
    ? `${label}: ${formatGrams(consumed)} grams consumed, ${formatGrams(-remaining)} grams over goal`
    : `${label}: ${formatGrams(consumed)} grams consumed, ${formatGrams(remaining)} grams left`;

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.labelRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        </View>
        <Text style={[styles.consumed, { color: colors.textPrimary }]}>
          <AnimatedNumber
            value={consumed}
            format={(shown) => `${formatGrams(shown)}g`}
          />
          <Text style={[styles.goal, { color: colors.textSecondary }]}>
            {` of ${formatGrams(goal)}g`}
          </Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.ringTrack }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: color, width: fillWidth }]}
        />
      </View>
      <Text
        style={[
          styles.remaining,
          isOver
            ? { color: colors.over, fontWeight: '600' }
            : { color: colors.textSecondary },
        ]}
      >
        <AnimatedNumber
          value={remaining}
          format={(shown) =>
            shown < 0
              ? `${formatGrams(-shown)}g over`
              : `${formatGrams(shown)}g left`
          }
        />
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typeScale.label,
  },
  consumed: {
    ...typeScale.bodyStrong,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  goal: {
    ...typeScale.caption,
    fontWeight: '400',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  remaining: {
    ...typeScale.caption,
    marginTop: spacing.xs + 2,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
