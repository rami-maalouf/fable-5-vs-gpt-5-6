// calorie card plus macro bars, rendered purely from the derived day summary.
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { MacroBar } from '@/components/dashboard/MacroBar';
import {
  clampProgress,
  DAILY_GOALS,
  formatCalories,
  type DaySummary,
} from '@/domain/nutrition';
import { radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';

type NutritionSummaryProps = {
  summary: DaySummary;
};

export function NutritionSummary({ summary }: NutritionSummaryProps) {
  const colors = useThemeColors();

  const remainingCalories = summary.remaining.calories;
  const isOver = remainingCalories < 0;
  const calorieProgress = clampProgress(
    summary.consumed.calories,
    DAILY_GOALS.calories,
  );
  const calorieNumber = formatCalories(Math.abs(remainingCalories));
  const calorieCaption = isOver ? 'calories over' : 'calories left';

  return (
    <View>
      <View
        style={[
          styles.calorieCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          accessible
          accessibilityLabel={`${calorieNumber} ${calorieCaption} today`}
        >
          <Text
            style={[
              styles.calorieNumber,
              { color: isOver ? colors.over : colors.textPrimary },
            ]}
          >
            <AnimatedNumber
              value={remainingCalories}
              format={(shown) => formatCalories(Math.abs(shown))}
            />
          </Text>
          <Text style={[styles.calorieCaption, { color: colors.textSecondary }]}>
            {calorieCaption}
          </Text>
        </View>
        <CalorieRing
          progress={calorieProgress}
          size={116}
          strokeWidth={12}
          trackColor={colors.ringTrack}
          progressColor={isOver ? colors.over : colors.accent}
        />
      </View>

      <View
        style={[
          styles.macroCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <MacroBar
          label="Protein"
          consumed={summary.consumed.protein_g}
          goal={DAILY_GOALS.protein_g}
          color={colors.protein}
        />
        <MacroBar
          label="Carbs"
          consumed={summary.consumed.carbs_g}
          goal={DAILY_GOALS.carbs_g}
          color={colors.carbs}
        />
        <MacroBar
          label="Fat"
          consumed={summary.consumed.fat_g}
          goal={DAILY_GOALS.fat_g}
          color={colors.fat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xxl,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  calorieNumber: {
    ...typeScale.display,
    fontVariant: ['tabular-nums'],
  },
  calorieCaption: {
    ...typeScale.body,
    marginTop: spacing.xs,
  },
  macroCard: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
});
