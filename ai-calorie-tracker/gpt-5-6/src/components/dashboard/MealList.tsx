import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { formatMacro, type Meal } from '@/domain/nutrition';
import { useNourishTheme } from '@/theme/tokens';

type MealListProps = {
  meals: readonly Meal[];
};

function EmptyPlate() {
  const theme = useNourishTheme();

  return (
    <View style={[styles.plate, { borderColor: theme.emptyIcon }]}>
      <View style={[styles.plateInner, { borderColor: theme.emptyIcon }]} />
    </View>
  );
}

export function MealList({ meals }: MealListProps) {
  const theme = useNourishTheme();

  if (meals.length === 0) {
    return (
      <View
        style={[
          styles.emptyState,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <EmptyPlate />
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing logged yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Scan a meal and your nutrition will land here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mealList}>
      {meals.map((meal) => (
        <View
          accessibilityLabel={`${meal.food}, ${meal.calories} calories`}
          key={meal.id}
          style={[
            styles.mealRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <Image
            accessibilityLabel={`${meal.food} thumbnail`}
            contentFit="cover"
            source={{ uri: meal.thumbnailUri }}
            style={[styles.thumbnail, { backgroundColor: theme.track }]}
          />
          <View style={styles.mealCopy}>
            <View style={styles.mealHeading}>
              <Text numberOfLines={1} style={[styles.mealName, { color: theme.text }]}>
                {meal.food}
              </Text>
              <Text style={[styles.mealCalories, { color: theme.text }]}>
                {meal.calories} kcal
              </Text>
            </View>
            <Text numberOfLines={1} style={[styles.mealMacros, { color: theme.textMuted }]}>
              P {formatMacro(meal.protein_g)} · C {formatMacro(meal.carbs_g)} · F{' '}
              {formatMacro(meal.fat_g)} g
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    borderRadius: 27,
    borderWidth: 2,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  plateInner: {
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    width: 36,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 16,
    minHeight: 104,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  mealList: {
    gap: 12,
  },
  mealRow: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    padding: 10,
  },
  thumbnail: {
    borderRadius: 14,
    height: 68,
    width: 68,
  },
  mealCopy: {
    flex: 1,
    gap: 7,
    minWidth: 0,
    paddingRight: 4,
  },
  mealHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  mealCalories: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  mealMacros: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});
