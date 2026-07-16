import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { AppTheme } from '@/theme';

import type { SleepLogRowModel } from './sleep-log-rows';

type SleepLogRowProps = {
  row: SleepLogRowModel;
  theme: AppTheme;
  isLast: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

export function AddSleepLogButton({ onPress, theme }: { onPress: () => void; theme: AppTheme }) {
  return (
    <Pressable
      accessibilityLabel="add sleep log"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: rgba(theme.textPrimary, 0.12), borderColor: rgba(theme.textPrimary, 0.18) },
        pressed && styles.pressed,
      ]}>
      <SymbolView name="plus" size={22} tintColor={theme.textPrimary} />
    </Pressable>
  );
}

export function SleepLogRow({ isLast, onDelete, onEdit, row, theme }: SleepLogRowProps) {
  return (
    <Swipeable
      friction={2}
      overshootRight={false}
      renderRightActions={() => <DeleteAction onDelete={onDelete} theme={theme} />}
      rightThreshold={56}>
      <Pressable
        accessibilityHint="opens the sleep log editor"
        accessibilityLabel={`edit sleep log for ${row.dayLabel}`}
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.row,
          !isLast && { borderBottomColor: rgba(theme.textPrimary, 0.12), borderBottomWidth: StyleSheet.hairlineWidth },
          pressed && styles.pressed,
        ]}>
        <View style={styles.rowText}>
          <Text style={[styles.dayLabel, { color: theme.textPrimary }]}>{row.dayLabel}</Text>
          <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
            {row.startLabel} {'->'} {row.endLabel}
          </Text>
        </View>
        <Text style={[styles.durationBadge, { backgroundColor: rgba(theme.textPrimary, 0.1), color: theme.textPrimary }]}>
          {row.durationLabel}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

function DeleteAction({ onDelete, theme }: { onDelete: () => void; theme: AppTheme }) {
  return (
    <Pressable
      accessibilityLabel="delete sleep log"
      accessibilityRole="button"
      onPress={onDelete}
      style={({ pressed }) => [styles.deleteAction, { backgroundColor: theme.warning }, pressed && styles.pressed]}>
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 72,
    paddingVertical: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  dayLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  durationBadge: {
    borderRadius: 8,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
    paddingHorizontal: Spacing.four,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
