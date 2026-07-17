import { StyleSheet, Text, View } from 'react-native';
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

export function NutritionSummary({ summary }: NutritionSummaryProps) {
  const theme = useNourishTheme();
  const calorieProgress = getProgress(
    summary.consumed.calories,
    DAILY_GOALS.calories,
  );
  const calorieOffset = ringCircumference * (1 - calorieProgress);

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
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={theme.coral}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={`${ringCircumference} ${ringCircumference}`}
              strokeDashoffset={calorieOffset}
              rotation="-90"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
          <View style={styles.ringContent}>
            <Text
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
              {formatCalories(summary.remaining.calories)}
            </Text>
            <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>
              calories left
            </Text>
          </View>
        </View>
        <Text style={[styles.calorieConsumed, { color: theme.textMuted }]}>
          {formatCalories(summary.consumed.calories)} of {DAILY_GOALS.calories} kcal
        </Text>
      </View>

      <View style={styles.macroList}>
        {macroRows.map((macro) => {
          const consumed = summary.consumed[macro.key];
          const remaining = summary.remaining[macro.key];
          const progress = getProgress(consumed, DAILY_GOALS[macro.key]);
          const accent = theme[macro.color];

          return (
            <View
              accessibilityLabel={`${macro.label}: ${formatMacro(consumed)} grams consumed, ${remainingLabel(remaining)}`}
              key={macro.key}
              style={styles.macroRow}>
              <View style={styles.macroHeader}>
                <Text style={[styles.macroLabel, { color: theme.text }]}>
                  {macro.label}
                </Text>
                <View style={styles.macroNumbers}>
                  <Text style={[styles.macroConsumed, { color: theme.text }]}>
                    {formatMacro(consumed)} g
                  </Text>
                  <Text
                    style={[
                      styles.macroRemaining,
                      {
                        color: remaining < 0 ? theme.overGoal : theme.textMuted,
                      },
                    ]}>
                    {remainingLabel(remaining)}
                  </Text>
                </View>
              </View>
              <View style={[styles.macroTrack, { backgroundColor: theme.track }]}>
                <View
                  style={[
                    styles.macroFill,
                    { backgroundColor: accent, width: `${progress * 100}%` },
                  ]}
                />
              </View>
            </View>
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
