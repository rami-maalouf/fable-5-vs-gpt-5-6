import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCalories, formatMacro } from '@/domain/nutrition';
import type { ScanSuccess } from '@/domain/scan-contract';
import { useNourishTheme } from '@/theme/tokens';

type ResultCardProps = {
  accepting: boolean;
  onAccept: () => void;
  onDiscard: () => void;
  result: ScanSuccess;
};

const macroFields = [
  { key: 'protein_g', label: 'Protein' },
  { key: 'carbs_g', label: 'Carbs' },
  { key: 'fat_g', label: 'Fat' },
] as const;

export function ResultCard({
  accepting,
  onAccept,
  onDiscard,
  result,
}: ResultCardProps) {
  const theme = useNourishTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.eyebrow, { color: theme.coral }]}>AI ESTIMATE</Text>
        <View style={styles.heading}>
          <Text numberOfLines={2} style={[styles.food, { color: theme.text }]}>
            {result.food}
          </Text>
          <View style={styles.calories}>
            <Text style={[styles.calorieValue, { color: theme.text }]}>
              {formatCalories(result.calories)}
            </Text>
            <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>calories</Text>
          </View>
        </View>

        <View style={styles.macros}>
          {macroFields.map((field) => (
            <View
              key={field.key}
              style={[styles.macro, { backgroundColor: theme.background }]}>
              <Text style={[styles.macroValue, { color: theme.text }]}>
                {formatMacro(result[field.key])} g
              </Text>
              <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                {field.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Discard estimate"
            accessibilityRole="button"
            disabled={accepting}
            onPress={onDiscard}
            style={({ pressed }) => [
              styles.discardButton,
              {
                borderColor: theme.border,
                opacity: pressed || accepting ? 0.65 : 1,
              },
            ]}>
            <Text style={[styles.discardLabel, { color: theme.text }]}>Discard</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Accept estimate"
            accessibilityRole="button"
            accessibilityState={{ disabled: accepting }}
            disabled={accepting}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.acceptButton,
              {
                backgroundColor: pressed ? theme.coralPressed : theme.coral,
                opacity: accepting ? 0.65 : 1,
              },
            ]}>
            <Text style={[styles.acceptLabel, { color: theme.onAccent }]}>
              {accepting ? 'Adding meal' : 'Accept'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  card: {
    borderRadius: 28,
    padding: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginTop: 7,
  },
  food: {
    flex: 1,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  calories: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 30,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 33,
  },
  calorieLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  macros: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  macro: {
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  macroValue: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  discardButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  discardLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  acceptButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1.6,
    justifyContent: 'center',
    minHeight: 52,
  },
  acceptLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
