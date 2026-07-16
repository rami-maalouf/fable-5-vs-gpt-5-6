import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import { settingsStore } from '@/data/settings-store';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/services/notification-permissions';
import {
  getScheduledWindDownNotifications,
  reconcileWindDownNotification,
  scheduleWindDownPreviewNotification,
} from '@/services/notifications';
import { useTheme } from '@/theme/ThemeProvider';

interface ScheduledSummary {
  identifier: string;
  title: string;
  trigger: string;
}

export default function NotificationSpikeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [scheduled, setScheduled] = useState<ScheduledSummary[]>([]);
  const [status, setStatus] = useState('Loading scheduled reminders...');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const requests = await getScheduledWindDownNotifications();
    setScheduled(summarizeRequests(requests));
    setStatus(scheduledCountMessage(requests.length));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    getScheduledWindDownNotifications()
      .then((requests) => {
        if (!isCurrent) return;
        setScheduled(summarizeRequests(requests));
        setStatus(scheduledCountMessage(requests.length));
      })
      .catch(() => {
        if (isCurrent) setStatus('Could not read scheduled reminders.');
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch {
      setStatus('The notification check failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const reconcile = async () => {
    const settings = await settingsStore.getAll();
    const result = await reconcileWindDownNotification({
      bedtimeMinutes: settings.optimalSleepMinutes,
      enabled: settings.windDownReminderEnabled,
    });
    setStatus(`Reconciliation result: ${result.status}`);
  };

  const schedulePreview = async () => {
    const authorized =
      (await getNotificationPermission()) || (await requestNotificationPermission());
    if (!authorized) {
      setStatus('Notification permission is required for a visible preview.');
      return;
    }
    await scheduleWindDownPreviewNotification({ seconds: 5 });
    setStatus('Preview scheduled for five seconds from now.');
  };

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Notification verification" style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Close notification verification" accessibilityRole="button" onPress={() => router.back()} style={styles.iconButton}>
            <PlatformSymbol androidName="close" color={theme.textPrimary} size={22} symbol="xmark" />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Notification verification</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.statusCard, { backgroundColor: theme.cardBackground }]}>
            <Text accessibilityRole="alert" style={[styles.status, { color: theme.textPrimary }]}>{status}</Text>
            <Text style={[styles.detail, { color: theme.textSecondary }]}>Production reminder: daily, three hours before bedtime</Text>
          </View>
          <ActionButton disabled={busy} label="Reconcile saved reminder" onPress={() => void run(reconcile)} />
          <ActionButton disabled={busy} label="Schedule 5-second preview" onPress={() => void run(schedulePreview)} />
          <ActionButton disabled={busy} label="Refresh scheduled requests" onPress={() => void run(async () => undefined)} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SCHEDULED REQUESTS</Text>
          {scheduled.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No Twilight reminders are scheduled.</Text>
          ) : (
            scheduled.map((request) => (
              <View key={request.identifier} style={[styles.requestCard, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.requestTitle, { color: theme.textPrimary }]}>{request.title}</Text>
                <Text selectable style={[styles.requestDetail, { color: theme.textSecondary }]}>{request.identifier}</Text>
                <Text selectable style={[styles.requestDetail, { color: theme.textSecondary }]}>{request.trigger}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function summarizeRequests(
  requests: Awaited<ReturnType<typeof getScheduledWindDownNotifications>>,
): ScheduledSummary[] {
  return requests.map((request) => ({
    identifier: request.identifier,
    title: request.content.title ?? 'Untitled',
    trigger: JSON.stringify(request.trigger),
  }));
}

function scheduledCountMessage(count: number): string {
  return `${count} Twilight reminder${count === 1 ? '' : 's'} scheduled`;
}

function ActionButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress(): void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: theme.actionPrimary },
        (disabled || pressed) && styles.dimmed,
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: { alignItems: 'center', borderRadius: 16, minHeight: 50, justifyContent: 'center', paddingHorizontal: 16 },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  content: { gap: 12, padding: 18, paddingBottom: 40 },
  detail: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  dimmed: { opacity: 0.6 },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: 12, textAlign: 'center' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  requestCard: { borderColor: 'rgba(255,255,255,0.15)', borderRadius: 16, borderWidth: 1, gap: 4, padding: 14 },
  requestDetail: { fontSize: 11, lineHeight: 16 },
  requestTitle: { fontSize: 15, fontWeight: '800' },
  safeArea: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, marginTop: 8 },
  status: { fontSize: 17, fontWeight: '800' },
  statusCard: { borderColor: 'rgba(255,255,255,0.15)', borderRadius: 18, borderWidth: 1, padding: 16 },
  title: { flex: 1, fontSize: 22, fontWeight: '800' },
});
