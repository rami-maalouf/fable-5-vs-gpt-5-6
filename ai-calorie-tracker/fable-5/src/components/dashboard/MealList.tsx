// today's meal section: a designed empty state or image-led meal rows.
// pure presentation: meals arrive as props, nothing is fetched or mutated.
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { formatCalories, formatGrams, type Meal } from '@/domain/nutrition';
import { motion, radius, spacing, typeScale } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { ColorTokens } from '@/theme/tokens';

type MealListProps = {
  meals: readonly Meal[];
};

export function MealList({ meals }: MealListProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textPrimary }]}
      >
        Meals
      </Text>
      {meals.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <View style={styles.rows}>
          {meals.map((meal) => (
            <MealRow key={meal.id} meal={meal} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

function EmptyState({ colors }: { colors: ColorTokens }) {
  return (
    <View
      style={[
        styles.emptyCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.emptyBadge, { backgroundColor: colors.surfaceMuted }]}>
        <Svg width={34} height={34}>
          <Circle
            cx={17}
            cy={17}
            r={15}
            stroke={colors.textSecondary}
            strokeWidth={2}
            fill="none"
          />
          <Circle
            cx={17}
            cy={17}
            r={8}
            stroke={colors.textSecondary}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No meals yet
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
        Scan your first meal and Nourish will log its calories and macros here.
      </Text>
    </View>
  );
}

function MealRow({ meal, colors }: { meal: Meal; colors: ColorTokens }) {
  const reducedMotion = useReducedMotion();
  // one short mount entrance keyed to the row, so a freshly accepted meal
  // fades in (with a small rise under full motion) while existing rows and
  // the absolutely positioned scan button stay exactly where they were
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: motion.standard,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);
  const entranceRise = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const accessibilityLabel =
    `${meal.food}, ${formatCalories(meal.calories)} calories, ` +
    `${formatGrams(meal.protein_g)} grams protein, ` +
    `${formatGrams(meal.carbs_g)} grams carbs, ` +
    `${formatGrams(meal.fat_g)} grams fat`;

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: entrance,
          transform: reducedMotion
            ? undefined
            : [{ translateY: entranceRise }],
        },
      ]}
    >
      <Image
        testID={`meal-thumbnail-${meal.id}`}
        source={{ uri: meal.thumbnailUri }}
        style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.rowBody}>
        <Text
          numberOfLines={1}
          style={[styles.rowTitle, { color: colors.textPrimary }]}
        >
          {meal.food}
        </Text>
        <Text numberOfLines={1} style={styles.rowMacros}>
          <Text style={{ color: colors.protein }}>
            {formatGrams(meal.protein_g)}g P
          </Text>
          <Text style={{ color: colors.textSecondary }}>{'  ·  '}</Text>
          <Text style={{ color: colors.carbs }}>
            {formatGrams(meal.carbs_g)}g C
          </Text>
          <Text style={{ color: colors.textSecondary }}>{'  ·  '}</Text>
          <Text style={{ color: colors.fat }}>{formatGrams(meal.fat_g)}g F</Text>
        </Text>
      </View>
      <View style={styles.rowCalories}>
        <Text style={[styles.rowCalorieNumber, { color: colors.textPrimary }]}>
          {formatCalories(meal.calories)}
        </Text>
        <Text style={[styles.rowCalorieUnit, { color: colors.textSecondary }]}>
          kcal
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    ...typeScale.heading,
    marginBottom: spacing.md,
  },
  rows: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.xxl,
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typeScale.bodyStrong,
    fontSize: 17,
  },
  emptyBody: {
    ...typeScale.label,
    fontWeight: '400',
    marginTop: spacing.xs + 2,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md + 4,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.sm + 2,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typeScale.bodyStrong,
    fontSize: 15,
  },
  rowMacros: {
    ...typeScale.caption,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  rowCalories: {
    alignItems: 'flex-end',
  },
  rowCalorieNumber: {
    ...typeScale.bodyStrong,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  rowCalorieUnit: {
    ...typeScale.caption,
  },
});
