import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { SleepLogRowModel } from '@/components/logs/sleep-log-model';
import { desaturateColor } from '@/theme/grayscale';
import { useTheme } from '@/theme/ThemeProvider';

interface SleepLogRowProps {
  isFirst: boolean;
  isLast: boolean;
  model: SleepLogRowModel;
  onDelete(): void;
  onPress(): void;
}

export function SleepLogRow({ isFirst, isLast, model, onDelete, onPress }: SleepLogRowProps) {
  const { isSleeping, theme } = useTheme();
  const destructiveColor = isSleeping ? desaturateColor('#ff453a') : '#ff453a';

  const renderDelete = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <Pressable
      accessibilityLabel={`Delete sleep log for ${model.dateLabel}`}
      accessibilityRole="button"
      onPress={() => {
        methods.close();
        onDelete();
      }}
      style={[styles.deleteAction, { backgroundColor: destructiveColor }]}
    >
      <SymbolView name="trash.fill" size={20} tintColor="#ffffff" />
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      containerStyle={[
        styles.swipeContainer,
        isFirst && styles.firstRow,
        isLast && styles.lastRow,
      ]}
      friction={1.7}
      overshootRight={false}
      renderRightActions={renderDelete}
      rightThreshold={42}
      testID={`sleep-log-swipe-${model.id}`}
    >
      <Pressable
        accessibilityHint="Opens the sleep log editor"
        accessibilityLabel={`${model.dateLabel}, ${model.startLabel} to ${model.endLabel}, ${model.durationLabel}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.72 : 1 },
          isFirst && styles.firstRow,
          isLast && styles.lastRow,
        ]}
        testID={`sleep-log-${model.id}`}
      >
        <View style={styles.copy}>
          <Text style={[styles.date, { color: theme.textPrimary }]}>{model.dateLabel}</Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {model.startLabel} → {model.endLabel}
          </Text>
        </View>
        <Text style={[styles.duration, { color: theme.accent }]}>{model.durationLabel}</Text>
        {!isLast ? <View style={styles.separator} /> : null}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1 },
  date: { fontSize: 20, fontWeight: '800' },
  deleteAction: { alignItems: 'center', justifyContent: 'center', width: 88 },
  deleteText: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginTop: 5 },
  duration: { fontSize: 20, fontVariant: ['tabular-nums'], fontWeight: '500' },
  firstRow: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lastRow: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 96,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  separator: {
    backgroundColor: 'rgba(142,142,147,0.28)',
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 20,
    position: 'absolute',
    right: 20,
  },
  swipeContainer: { backgroundColor: 'transparent', overflow: 'hidden' },
  time: { fontSize: 16, marginTop: 5 },
});
