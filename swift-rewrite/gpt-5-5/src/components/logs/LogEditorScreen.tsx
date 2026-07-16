// ports: twilight/views/logs/sleepsessioneditorview.swift

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSessionRepository } from '@/data/session-store';
import { settingsStore } from '@/data/settings-store';
import { defaultSleepSettings, type SleepSession, type SleepSettings } from '@/domain/models';
import {
  applyEditorDraftToSession,
  buildManualLogSession,
  createLogEditorDraft,
  dateKeyFromDate,
  draftFromSession,
  type LogEditorDraft,
} from '@/domain/log-editor';
import type { AppTheme } from '@/theme';
import { useIsAsleep, useSleepAppearanceTheme } from '@/theme/sleep-appearance';

import { LogEditorFields } from './LogEditorFields';

type LoadState = 'loading' | 'ready' | 'error';

type LogEditorScreenProps = {
  sessionId?: string;
};

export function LogEditorScreen({ sessionId }: LogEditorScreenProps) {
  const theme = useSleepAppearanceTheme();
  const grayscale = useIsAsleep();
  const [draft, setDraft] = useState<LogEditorDraft | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [originalSession, setOriginalSession] = useState<SleepSession | null>(null);
  const [settings, setSettings] = useState<SleepSettings>(defaultSleepSettings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEditor = useCallback(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setError(null);

      try {
        const [nextSettings, repository] = await Promise.all([settingsStore.getSettings(), getSessionRepository()]);
        const loadedSession = sessionId ? await repository.getById(sessionId) : null;

        if (sessionId && !loadedSession) {
          throw new Error(`sleep session not found: ${sessionId}`);
        }

        const timeZone = loadedSession?.endTimeZone ?? loadedSession?.startTimeZone ?? resolvedTimeZone();
        const nextDraft = loadedSession
          ? draftFromSession(loadedSession)
          : createLogEditorDraft({
              sleepMinutes: nextSettings.optimalSleepMinutes,
              timeZone,
              wakeDayKey: dateKeyFromDate(new Date(), timeZone),
              wakeMinutes: nextSettings.optimalWakeMinutes,
            });

        if (!cancelled) {
          setDraft(nextDraft);
          setOriginalSession(loadedSession);
          setSettings(nextSettings);
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) {
          setLoadState('error');
          setError('Could not load this sleep log.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(loadEditor, [loadEditor]);

  async function saveDraft() {
    if (!draft || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const repository = await getSessionRepository();
      const now = new Date();

      if (originalSession) {
        await repository.update(applyEditorDraftToSession(originalSession, draft, now));
      } else {
        await repository.create(buildManualLogSession({ ...draft, id: createSessionId(), now }));
      }

      router.dismiss();
    } catch {
      setError('Could not save this sleep log. Check the times and try again.');
      setSaving(false);
    }
  }

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        {loadState === 'ready' && draft ? (
          <LogEditorFields
            draft={draft}
            error={error}
            grayscale={grayscale}
            mode={originalSession ? 'edit' : 'new'}
            onCancel={() => router.dismiss()}
            onChange={setDraft}
            onSave={saveDraft}
            saving={saving}
            settings={settings}
            theme={theme}
          />
        ) : (
          <LoadingOrErrorCard error={error} loading={loadState === 'loading'} onCancel={() => router.dismiss()} theme={theme} />
        )}
      </ScrollView>
    </ScreenChrome>
  );
}

function LoadingOrErrorCard({
  error,
  loading,
  onCancel,
  theme,
}: {
  error: string | null;
  loading: boolean;
  onCancel: () => void;
  theme: AppTheme;
}) {
  return (
    <>
      <View style={styles.toolbar}>
        <Text style={[styles.toolbarTitle, { color: theme.textPrimary }]}>Log Sleep</Text>
        <Text onPress={onCancel} style={[styles.cancelText, { color: theme.textPrimary }]}>Cancel</Text>
      </View>
      <CardBackground theme={theme} style={styles.card}>
        {loading ? <ActivityIndicator color={theme.actionPrimary} /> : null}
        <Text style={[styles.stateTitle, { color: theme.textPrimary }]}>{loading ? 'Loading log...' : 'Log unavailable'}</Text>
        {error ? <Text style={[styles.stateBody, { color: theme.textSecondary }]}>{error}</Text> : null}
      </CardBackground>
    </>
  );
}

function resolvedTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    flexGrow: 1,
    marginHorizontal: 'auto',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    width: '100%',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: 0,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  stateBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
});
