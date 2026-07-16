import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { rgba } from '@/components/common/color';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSessionRepository } from '@/data/session-store';
import type { SleepSession } from '@/domain/models';
import type { AppTheme } from '@/theme';
import { useSleepAppearanceTheme, useSleepSettings } from '@/theme/sleep-appearance';

import {
  buildMetricsScreenModel,
  type MetricsCardModel,
  type MetricsRange,
  type MetricsScreenModel,
} from './metrics-screen-model';
import {
  DurationMomentumCard,
  DurationHistogramCard,
  RollingComponentsCard,
  RollingConsistencyCard,
  SleepDebtCard,
  WeekdayAveragesCard,
} from './MetricsCharts';

type LoadState = 'loading' | 'ready' | 'error';
type SheetMode = 'timeline' | 'explanation' | null;

const ranges: MetricsRange[] = ['30D', '90D', '1Y', 'All'];

function Header({
  onOpenExplanation,
  onOpenTimeline,
  theme,
}: {
  onOpenExplanation: () => void;
  onOpenTimeline: () => void;
  theme: AppTheme;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>insights</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Metrics</Text>
      </View>
      <View style={styles.toolbar}>
        <ToolbarButton onPress={onOpenTimeline} theme={theme} title="Timeline" />
        <ToolbarButton onPress={onOpenExplanation} theme={theme} title="Guide" />
      </View>
    </View>
  );
}

function ToolbarButton({ onPress, theme, title }: { onPress: () => void; theme: AppTheme; title: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        { backgroundColor: rgba(theme.textPrimary, 0.08), borderColor: rgba(theme.textPrimary, 0.14) },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.toolbarText, { color: theme.textPrimary }]}>{title}</Text>
    </Pressable>
  );
}

function RangePicker({
  onChange,
  range,
  theme,
}: {
  onChange: (range: MetricsRange) => void;
  range: MetricsRange;
  theme: AppTheme;
}) {
  return (
    <CardBackground theme={theme} style={styles.rangeCard}>
      <View style={styles.rangeRow}>
        {ranges.map((item) => {
          const selected = item === range;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={item}
              onPress={() => onChange(item)}
              style={({ pressed }) => [
                styles.rangeButton,
                { backgroundColor: selected ? theme.actionPrimary : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.rangeText, { color: selected ? '#ffffff' : theme.textSecondary }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </CardBackground>
  );
}

function SectionTitle({ kicker, theme, title }: { kicker?: string; theme: AppTheme; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      {kicker ? <Text style={[styles.sectionKicker, { color: theme.textSecondary }]}>{kicker}</Text> : null}
      <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>{title}</Text>
    </View>
  );
}

function MetricCard({ card, theme }: { card: MetricsCardModel; theme: AppTheme }) {
  const toneColor =
    card.tone === 'success'
      ? theme.success
      : card.tone === 'warning'
        ? theme.warning
        : card.tone === 'accent'
          ? theme.actionPrimary
          : theme.textSecondary;

  return (
    <CardBackground theme={theme} style={styles.metricCard}>
      <View style={[styles.metricAccent, { backgroundColor: rgba(toneColor, 0.18) }]} />
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{card.label}</Text>
      <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{card.value}</Text>
      <Text style={[styles.metricSupporting, { color: theme.textSecondary }]}>{card.supporting}</Text>
    </CardBackground>
  );
}

function CardGrid({ cards, theme }: { cards: MetricsCardModel[]; theme: AppTheme }) {
  return (
    <View style={styles.cardGrid}>
      {cards.map((card) => (
        <MetricCard card={card} key={card.label} theme={theme} />
      ))}
    </View>
  );
}

function EmptyState({ loading, theme }: { loading: boolean; theme: AppTheme }) {
  return (
    <CardBackground theme={theme} style={styles.emptyCard}>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {loading ? 'Loading sleep metrics' : 'No tracked nights yet'}
      </Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
        {loading
          ? 'Pulling valid sleep sessions from the local store.'
          : 'Start sleep mode or add a manual log. Metrics will fill in as soon as there is one valid night.'}
      </Text>
    </CardBackground>
  );
}

function FooterTiles({ model, theme }: { model: MetricsScreenModel; theme: AppTheme }) {
  return (
    <View style={styles.footerTiles}>
      {model.footerTiles.map((tile) => (
        <View
          key={tile.label}
          style={[styles.footerTile, { backgroundColor: rgba(theme.textPrimary, 0.07), borderColor: rgba(theme.textPrimary, 0.12) }]}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>{tile.label}</Text>
          <Text style={[styles.footerValue, { color: theme.textPrimary }]}>{tile.value}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricsSheet({
  model,
  mode,
  onClose,
  theme,
}: {
  model: MetricsScreenModel;
  mode: SheetMode;
  onClose: () => void;
  theme: AppTheme;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={mode != null}>
      <View style={styles.sheetBackdrop}>
        <CardBackground theme={theme} style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
              {mode === 'timeline' ? 'Sleep Timeline' : 'Metrics Guide'}
            </Text>
            <ToolbarButton onPress={onClose} theme={theme} title="Close" />
          </View>
          {mode === 'timeline' ? <TimelineSheet model={model} theme={theme} /> : <ExplanationSheet theme={theme} />}
        </CardBackground>
      </View>
    </Modal>
  );
}

function TimelineSheet({ model, theme }: { model: MetricsScreenModel; theme: AppTheme }) {
  if (model.rangeRecords.length === 0) {
    return <Text style={[styles.sheetBody, { color: theme.textSecondary }]}>No valid sleep sessions in this range yet.</Text>;
  }

  return (
    <View style={styles.timelineList}>
      {model.rangeRecords.slice(-8).map((record) => (
        <View
          key={record.sessionId}
          style={[styles.timelineRow, { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
          <View style={styles.timelineHeaderRow}>
            <Text style={[styles.timelineDate, { color: theme.textPrimary }]}>{record.dateKey}</Text>
            <Text style={[styles.timelineValue, { color: theme.textSecondary }]}>{record.durationHours.toFixed(1)}h tracked</Text>
          </View>
          <View style={[styles.timelineTrack, { backgroundColor: rgba(theme.textPrimary, 0.08) }]}>
            <View
              style={[
                styles.timelineBar,
                {
                  backgroundColor: rgba(theme.actionPrimary, 0.72),
                  left: `${Math.min(94, Math.max(0, (record.bedtimeOffsetHours / 24) * 100))}%`,
                  width: `${Math.max(4, Math.min(100, (record.durationHours / 24) * 100))}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function ExplanationSheet({ theme }: { theme: AppTheme }) {
  return (
    <View style={styles.timelineList}>
      {[
        ['average sleep', 'Mean valid sleep duration in the selected range.'],
        ['goal hit rate', 'Share of nights within 45 minutes of your sleep goal.'],
        ['alignment', 'Weighted sleep alignment score from duration, timing, phase, and consistency.'],
        ['coverage', 'How many days in the selected range have a valid tracked night.'],
      ].map(([title, body]) => (
        <View key={title} style={[styles.timelineRow, { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
          <Text style={[styles.timelineDate, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.timelineValue, { color: theme.textSecondary }]}>{body}</Text>
        </View>
      ))}
    </View>
  );
}

export function MetricsScreen() {
  const theme = useSleepAppearanceTheme();
  const settings = useSleepSettings();
  const [range, setRange] = useState<MetricsRange>('30D');
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const loadSessions = useCallback(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadState('loading');
        const repository = await getSessionRepository();
        const nextSessions = await repository.listValidSessions();

        if (!cancelled) {
          setSessions(nextSessions);
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) {
          setLoadState('error');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(loadSessions);

  const model = useMemo(
    () => buildMetricsScreenModel({ range, sessions, settings }),
    [range, sessions, settings],
  );

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          onOpenExplanation={() => setSheetMode('explanation')}
          onOpenTimeline={() => setSheetMode('timeline')}
          theme={theme}
        />
        <RangePicker onChange={setRange} range={range} theme={theme} />

        {loadState === 'error' ? (
          <CardBackground theme={theme} style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Metrics failed to load</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Try leaving and reopening the Metrics tab.</Text>
          </CardBackground>
        ) : null}
        {loadState !== 'error' && model.isEmpty ? <EmptyState loading={loadState === 'loading'} theme={theme} /> : null}

        <SectionTitle kicker={range} theme={theme} title="Overview" />
        <CardGrid cards={model.overviewCards} theme={theme} />

        <SectionTitle theme={theme} title="Highlights" />
        <CardGrid cards={model.highlights} theme={theme} />

        <SectionTitle kicker="charts" theme={theme} title="Detailed Trends" />
        <DurationMomentumCard records={model.rangeRecords} settings={settings} theme={theme} />
        <RollingConsistencyCard records={model.rangeRecords} settings={settings} theme={theme} />
        <RollingComponentsCard records={model.rangeRecords} settings={settings} theme={theme} />
        <SleepDebtCard records={model.rangeRecords} settings={settings} theme={theme} />
        <WeekdayAveragesCard records={model.rangeRecords} theme={theme} />
        <DurationHistogramCard records={model.rangeRecords} theme={theme} />

        <FooterTiles model={model} theme={theme} />
      </ScrollView>
      <MetricsSheet model={model} mode={sheetMode} onClose={() => setSheetMode(null)} theme={theme} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    width: '100%',
  },
  emptyBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginTop: Spacing.two,
  },
  emptyCard: {
    marginHorizontal: Spacing.two,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  footerTile: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 150,
    padding: Spacing.three,
  },
  footerTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: Spacing.one,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  metricAccent: {
    borderRadius: 999,
    height: 10,
    marginBottom: Spacing.two,
    width: 36,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    marginHorizontal: 0,
    minWidth: 158,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricSupporting: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: Spacing.one,
  },
  metricValue: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.9,
    lineHeight: 36,
    marginTop: Spacing.one,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  rangeButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    paddingVertical: Spacing.two,
  },
  rangeCard: {
    marginHorizontal: Spacing.two,
    padding: Spacing.two,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBody: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  sheetCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    maxHeight: '82%',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sheetTitle: {
    fontSize: 25,
    fontWeight: '900',
  },
  timelineDate: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  timelineBar: {
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 10,
    position: 'absolute',
    top: 0,
  },
  timelineHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  timelineList: {
    gap: Spacing.two,
  },
  timelineRow: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
  },
  timelineTrack: {
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 10,
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
    marginTop: Spacing.one,
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toolbarButton: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  toolbarText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
