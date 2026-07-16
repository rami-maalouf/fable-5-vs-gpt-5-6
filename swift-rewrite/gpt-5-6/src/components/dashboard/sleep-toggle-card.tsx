import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground } from '@/components/common/card-background';
import { formatElapsedSleep } from '@/components/dashboard/sleep-toggle';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

interface SleepToggleCardProps {
  activeSession: SleepSession | null;
  elapsedSeconds: number;
  isBusy: boolean;
  joke: string | null;
  lastNightDurationHours: number | null;
  durationChangePercent: number | null;
  streak: number;
  onToggle(): void;
}

export function SleepToggleCard({
  activeSession,
  elapsedSeconds,
  isBusy,
  joke,
  lastNightDurationHours,
  durationChangePercent,
  streak,
  onToggle,
}: SleepToggleCardProps) {
  const { theme } = useTheme();
  const isSleeping = activeSession !== null;
  const actionColor = isSleeping ? theme.warning : theme.actionPrimary;

  return (
    <View>
      <CardBackground active={isSleeping} style={styles.statusCard}>
        {isSleeping ? (
          <>
            <View style={styles.statusHeading}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>ACTIVE SESSION</Text>
            </View>
            <Text
              accessibilityLabel={`${formatElapsedSleep(elapsedSeconds)} time asleep`}
              style={[styles.elapsed, { color: theme.textPrimary }]}
              testID="sleep-elapsed-time"
            >
              {formatElapsedSleep(elapsedSeconds)}
            </Text>
            <Text style={[styles.elapsedLabel, { color: theme.textSecondary }]}>time asleep</Text>
          </>
        ) : (
          <>
            <View style={styles.lastNightHeading}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Last Night&apos;s Sleep</Text>
              {streak > 0 ? (
                <View style={[styles.streakPill, { borderColor: theme.warning }]}>
                  <SymbolView name="flame.fill" size={18} tintColor={theme.warning} />
                  <Text style={[styles.streakText, { color: theme.textPrimary }]}>{streak}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.durationRow}>
              <Text style={[styles.lastDuration, { color: theme.textPrimary }]}>
                {lastNightDurationHours === null ? '--' : formatLastNightDuration(lastNightDurationHours)}
              </Text>
              {durationChangePercent === null ? null : (
                <Text style={[styles.change, { color: durationChangePercent >= 0 ? theme.success : '#ff453a' }]}>
                  {formatChange(durationChangePercent)}
                </Text>
              )}
            </View>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isBusy, disabled: isBusy }}
          disabled={isBusy}
          onPress={onToggle}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: actionColor, opacity: isBusy ? 0.55 : pressed ? 0.82 : 1 },
          ]}
          testID="sleep-toggle-button"
        >
          <SymbolView
            name={isSleeping ? 'sun.max.fill' : 'moon.fill'}
            size={20}
            tintColor="#ffffff"
          />
          <Text style={styles.actionTitle}>
            {isBusy ? 'Loading...' : isSleeping ? 'Wake Up' : 'Go to Sleep'}
          </Text>
        </Pressable>
        <Text style={[styles.actionCaption, { color: theme.textSecondary }]}>
          {isSleeping ? 'Tap when you are ready to begin the day' : 'Tap to start your sleep session'}
        </Text>
      </CardBackground>

      {joke ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[styles.toast, { backgroundColor: theme.actionSecondary }]}
          testID="short-sleep-toast"
        >
          <SymbolView name="moon.zzz.fill" size={18} tintColor={theme.warning} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{joke}</Text>
        </View>
      ) : null}

    </View>
  );
}

function formatLastNightDuration(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min`;
}

function formatChange(percent: number): string {
  return `${percent >= 0 ? '↗' : '↘'}${Math.abs(Math.round(percent))}%`;
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionCaption: { fontSize: 12, marginTop: 10, textAlign: 'center' },
  actionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  change: { fontSize: 19, fontWeight: '800' },
  durationRow: { alignItems: 'baseline', flexDirection: 'row', gap: 10, marginTop: 20 },
  elapsed: { fontSize: 46, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 16 },
  elapsedLabel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  lastDuration: { fontSize: 34, fontVariant: ['tabular-nums'], fontWeight: '800' },
  lastNightHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusCard: { marginHorizontal: 16, minHeight: 242 },
  statusDot: { borderRadius: 4, height: 8, shadowOpacity: 0.8, shadowRadius: 6, width: 8 },
  statusHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  streakPill: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontSize: 16, fontVariant: ['tabular-nums'], fontWeight: '800' },
  toast: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
