import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import {
  DAILY_GOALS,
  formatCalories,
  formatMacro,
  getProgress,
  type DaySummary,
  type Nutrition,
} from '@/domain/nutrition';
import { useNourishTheme, type NourishTheme } from '@/theme/tokens';

const ringSize = 184;
const ringStroke = 13;
const ringRadius = (ringSize - ringStroke) / 2;
const ringCircumference = 2 * Math.PI * ringRadius;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const NUTRITION_MOTION_DURATION = 560;

const nutritionTiming = {
  duration: NUTRITION_MOTION_DURATION,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
} as const;

const valueEntering = FadeIn.duration(NUTRITION_MOTION_DURATION).reduceMotion(
  ReduceMotion.System,
);
type NutritionSummaryProps = {
  summary: DaySummary;
};

type MacroKey = Exclude<keyof Nutrition, 'calories'>;

const macroRows: {
  key: MacroKey;
  label: string;
  color: keyof Pick<NourishTheme, 'protein' | 'carbs' | 'fat'>;
}[] = [
  { key: 'protein_g', label: 'Protein', color: 'protein' },
  { key: 'carbs_g', label: 'Carbs', color: 'carbs' },
  { key: 'fat_g', label: 'Fat', color: 'fat' },
];

function remainingLabel(value: number) {
  if (value < 0) {
    return `${formatMacro(Math.abs(value))} g over`;
  }

  return `${formatMacro(value)} g left`;
}

export function getCalorieRingOffset(progress: number) {
  return ringCircumference * (1 - progress);
}

type AnimatedMacroRowProps = {
  accent: string;
  consumed: number;
  goal: number;
  label: string;
  remaining: number;
  testID: string;
  theme: NourishTheme;
};

function AnimatedMacroRow({
  accent,
  consumed,
  goal,
  label,
  remaining,
  testID,
  theme,
}: AnimatedMacroRowProps) {
  const targetProgress = getProgress(consumed, goal);
  const animatedProgress = useSharedValue(targetProgress);

  useEffect(() => {
    animatedProgress.value = withTiming(targetProgress, nutritionTiming);
  }, [animatedProgress, targetProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%` as `${number}%`,
  }));

  const consumedLabel = `${formatMacro(consumed)} g`;
  const remainingText = remainingLabel(remaining);

  return (
    <View
      accessibilityLabel={`${label}: ${formatMacro(consumed)} grams consumed, ${remainingText}`}
      style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: theme.text }]}>{label}</Text>
        <View style={styles.macroNumbers}>
          <Animated.Text
            entering={valueEntering}
            key={consumedLabel}
            style={[styles.macroConsumed, { color: theme.text }]}>
            {consumedLabel}
          </Animated.Text>
          <Animated.Text
            entering={valueEntering}
            key={remainingText}
            style={[
              styles.macroRemaining,
              {
                color: remaining < 0 ? theme.overGoal : theme.textMuted,
              },
            ]}>
            {remainingText}
          </Animated.Text>
        </View>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: theme.track }]}>
        <Animated.View
          style={[styles.macroFill, { backgroundColor: accent }, fillStyle]}
          testID={testID}
        />
      </View>
    </View>
  );
}

export function NutritionSummary({ summary }: NutritionSummaryProps) {
  const theme = useNourishTheme();
  const calorieProgress = getProgress(
    summary.consumed.calories,
    DAILY_GOALS.calories,
  );
  const animatedCalorieProgress = useSharedValue(calorieProgress);

  useEffect(() => {
    animatedCalorieProgress.value = withTiming(
      calorieProgress,
      nutritionTiming,
    );
  }, [animatedCalorieProgress, calorieProgress]);

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset:
      ringCircumference * (1 - animatedCalorieProgress.value),
  }));

  const remainingCalories = formatCalories(summary.remaining.calories);
  const consumedCalories = `${formatCalories(summary.consumed.calories)} of ${DAILY_GOALS.calories} kcal`;

  return (
    <>
      <View
        accessibilityLabel={`Calories: ${formatCalories(summary.consumed.calories)} of ${DAILY_GOALS.calories} consumed, ${formatCalories(summary.remaining.calories)} remaining`}
        style={[
          styles.calorieCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}>
        <View style={styles.ringWrap}>
          <Svg
            accessibilityElementsHidden
            width={ringSize}
            height={ringSize}
            style={styles.ring}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={theme.track}
              strokeWidth={ringStroke}
            />
            <AnimatedCircle
              animatedProps={animatedRingProps}
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={theme.coral}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={`${ringCircumference} ${ringCircumference}`}
              testID="calorie-progress-ring"
              rotation="-90"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
          <View style={styles.ringContent}>
            <Animated.Text
              entering={valueEntering}
              key={remainingCalories}
              numberOfLines={1}
              style={[
                styles.remainingCalories,
                {
                  color:
                    summary.remaining.calories < 0
                      ? theme.overGoal
                      : theme.text,
                },
              ]}>
              {remainingCalories}
            </Animated.Text>
            <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>
              calories left
            </Text>
          </View>
        </View>
        <Animated.Text
          entering={valueEntering}
          key={consumedCalories}
          style={[styles.calorieConsumed, { color: theme.textMuted }]}>
          {consumedCalories}
        </Animated.Text>
      </View>

      <View style={styles.macroList}>
        {macroRows.map((macro) => {
          const consumed = summary.consumed[macro.key];
          const remaining = summary.remaining[macro.key];
          const accent = theme[macro.color];

          return (
            <AnimatedMacroRow
              accent={accent}
              consumed={consumed}
              goal={DAILY_GOALS[macro.key]}
              key={macro.key}
              label={macro.label}
              remaining={remaining}
              testID={`${macro.label.toLowerCase()}-progress`}
              theme={theme}
            />
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  calorieCard: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
  },
  ringWrap: {
    height: ringSize,
    width: ringSize,
  },
  ring: {
    position: 'absolute',
  },
  ringContent: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  remainingCalories: {
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -2.2,
    lineHeight: 52,
    maxWidth: 148,
  },
  calorieLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  calorieConsumed: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    marginTop: 12,
  },
  macroList: {
    gap: 18,
    marginTop: 28,
  },
  macroRow: {
    gap: 9,
  },
  macroHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  macroNumbers: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 9,
  },
  macroConsumed: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  macroRemaining: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  macroTrack: {
    borderRadius: 6,
    height: 8,
    overflow: 'hidden',
  },
  macroFill: {
    borderRadius: 6,
    height: 8,
  },
});
