import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground } from '@/components/common/card-background';
import { GlassCard } from '@/components/common/glass-card';
import { formatElapsedSleep } from '@/components/dashboard/sleep-toggle';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

interface SleepToggleCardProps {
  activeSession: SleepSession | null;
  elapsedSeconds: number;
  isBusy: boolean;
  joke: string | null;
  onToggle(): void;
}

export function SleepToggleCard({
  activeSession,
  elapsedSeconds,
  isBusy,
  joke,
  onToggle,
}: SleepToggleCardProps) {
  const { theme } = useTheme();
  const isSleeping = activeSession !== null;
  const actionColor = isSleeping ? theme.warning : theme.actionPrimary;

  return (
    <View>
      <CardBackground active={isSleeping} style={styles.statusCard}>
        <View style={styles.statusHeading}>
          <View style={[styles.statusDot, { backgroundColor: isSleeping ? theme.success : theme.accent }]} />
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            {isSleeping ? 'ACTIVE SESSION' : 'TONIGHT'}
          </Text>
        </View>
        {isSleeping ? (
          <>
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
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Ready when you are</Text>
            <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>Your sleep ritual starts here.</Text>
          </>
        )}
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

      <GlassCard style={styles.actionCard}>
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
            {isBusy ? 'Loading...' : isSleeping ? 'Wake up' : 'Go to sleep'}
          </Text>
        </Pressable>
      </GlassCard>
    </View>
  );
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
  actionCard: { marginTop: 14 },
  actionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  cardCopy: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  cardTitle: { fontSize: 23, fontWeight: '800', marginTop: 12 },
  elapsed: { fontSize: 46, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 16 },
  elapsedLabel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  statusCard: { marginHorizontal: 16, minHeight: 176 },
  statusDot: { borderRadius: 4, height: 8, shadowOpacity: 0.8, shadowRadius: 6, width: 8 },
  statusHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
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
