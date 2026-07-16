import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground } from '@/components/common';
import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { SleepSession } from '@/domain/models';
import { durationSeconds, formatDuration } from '@/domain/session-rules';
import { endActiveSleepSession, startSleepSession } from '@/domain/sleep-toggle';
import { getSessionRepository } from '@/data/session-store';
import { themes } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function createSessionId() {
  return `sleep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeClock() {
  return {
    id: createSessionId,
    now: () => new Date(),
    timeZone: currentTimeZone,
  };
}

type SleepToggleCardProps = {
  onSessionChange?: () => void;
};

export function SleepToggleCard({ onSessionChange }: SleepToggleCardProps) {
  const theme = useSleepAppearanceTheme(themes.twilight);
  const [activeSession, setActiveSession] = useState<SleepSession | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const elapsedSeconds = useMemo(
    () => (activeSession ? durationSeconds(activeSession, now) : 0),
    [activeSession, now],
  );

  useEffect(() => {
    let cancelled = false;

    void getSessionRepository()
      .then((repository) => repository.getActiveSession())
      .then((session) => {
        if (!cancelled) {
          setActiveSession(session);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeSession) {
      return;
    }

    const interval = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const toggleSleep = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const repository = await getSessionRepository();

      if (activeSession) {
        const result = await endActiveSleepSession(repository, makeClock());

        if (result.status === 'ended') {
          setActiveSession(null);
          setFeedback(result.valid ? `Saved ${formatDuration(result.durationSeconds)}` : result.joke);
          onSessionChange?.();
        } else {
          setActiveSession(null);
          setFeedback('No active sleep session found.');
          onSessionChange?.();
        }
      } else {
        const session = await startSleepSession(repository, makeClock());
        setActiveSession(session);
        setNow(new Date());
        setFeedback(null);
        onSessionChange?.();
      }
    } finally {
      setBusy(false);
    }
  }, [activeSession, busy, onSessionChange]);

  return (
    <CardBackground active={Boolean(activeSession)} theme={theme} style={styles.card}>
      <View style={styles.content}>
        {activeSession ? (
          <View style={styles.centeredHeader}>
            <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>sleep mode activated</Text>
            <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>Dream Big!</Text>
            <Text style={[styles.elapsed, { color: theme.textPrimary }]}>{formatDuration(elapsedSeconds)}</Text>
          </View>
        ) : (
          <View style={styles.startHeader}>
            <Text style={[styles.startTitle, { color: theme.textPrimary }]}>Start tonight!</Text>
            <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>Track your first night to see insights</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeSession ? 'Wake Up' : 'Go to Sleep'}
          disabled={busy}
          onPress={toggleSleep}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: activeSession ? theme.warning : theme.actionPrimary,
              opacity: busy ? 0.6 : 1,
            },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.buttonText}>{activeSession ? 'Wake Up' : 'Go to Sleep'}</Text>
        </Pressable>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          {activeSession ? 'Tap to wake up' : 'Tap to start'}
        </Text>
        {feedback ? (
          <View style={[styles.feedback, { borderColor: rgba(theme.warning, 0.35) }]}>
            <Text style={[styles.feedbackText, { color: theme.warning }]}>{feedback}</Text>
          </View>
        ) : null}
      </View>
    </CardBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.two,
  },
  content: {
    gap: 16,
  },
  centeredHeader: {
    alignItems: 'center',
    gap: 4,
  },
  startHeader: {
    gap: 4,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modeSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  elapsed: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    borderRadius: 15,
    padding: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  feedback: {
    backgroundColor: 'rgba(255, 107, 53, 0.10)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
