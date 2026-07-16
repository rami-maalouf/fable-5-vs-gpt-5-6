// ports: Views/Logs/SleepLogsView.swift - one list row
// day headline, "start -> end" subheadline, duration badge (accent text like
// the original's button-tinted label), swipe to delete
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { SleepSession } from '@/domain/models';
import { resolveEndTimeZone, sessionDurationSeconds, wakeDay } from '@/domain/session-rules';
import { useTheme } from '@/theme/ThemeProvider';

// "Wed, Jul 15" like DateFormatters.formatDay's EEE d MMM template rendered
// by ios ("Wed, Jul 15" per the reference screenshot)
export function formatDayLabel(session: SleepSession): string {
  const day = wakeDay(session);
  const date = new Date(Date.UTC(day.year, day.month - 1, day.day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatClockTime(epochMs: number, timeZone: string): string {
  return new Date(epochMs)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
    .replace(/ /g, ' ');
}

function formatDurationBadge(durationSeconds: number): string {
  const h = Math.trunc(durationSeconds / 3600);
  const m = Math.trunc((durationSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <Pressable onPress={onDelete} style={styles.deleteAction}>
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );
}

export function LogRow({
  session,
  onPress,
  onDelete,
  isLast,
}: {
  session: SleepSession;
  onPress: () => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  const theme = useTheme();
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={() => <DeleteAction onDelete={onDelete} />}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.texts}>
          <Text style={[styles.day, { color: theme.textPrimary }]}>{formatDayLabel(session)}</Text>
          <Text style={styles.times}>
            {formatClockTime(session.startTime, session.startTimeZone)}
            {'  →  '}
            {session.endTime != null && formatClockTime(session.endTime, resolveEndTimeZone(session))}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: theme.accent }]}>
            {formatDurationBadge(sessionDurationSeconds(session))}
          </Text>
        </View>
      </Pressable>
      {!isLast && (
        <View style={styles.separatorTrack}>
          <View style={styles.separator} />
        </View>
      )}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1c1c1e',
  },
  texts: { flex: 1, gap: 3 },
  day: { fontSize: 17, fontWeight: '600' },
  times: { fontSize: 15, color: '#98989f' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  badgeText: { fontSize: 17, fontVariant: ['tabular-nums'] },
  separatorTrack: { backgroundColor: '#1c1c1e' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(84, 84, 88, 0.6)',
    marginLeft: 16,
  },
  deleteAction: {
    width: 88,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
