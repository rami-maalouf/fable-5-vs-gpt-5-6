// ports: twilight/views/sleepdashboardview.swift

import { StyleSheet, Text, View } from 'react-native';

import {
  alignmentComponentScores,
  type AlignmentCardMode,
  type AlignmentChartPoint,
} from '@/components/charts/dashboard-chart-models';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { useTheme } from '@/theme/ThemeProvider';

const targetScore = 70;

export function AlignmentCardHeader({
  data,
  mode,
  selected,
}: {
  data: readonly AlignmentChartPoint[];
  mode: AlignmentCardMode;
  selected: AlignmentChartPoint | undefined;
}) {
  const { theme } = useTheme();
  const latest = data.at(-1);
  const selectedPosition = selected
    ? data.findIndex((point) => point.dayKey === selected.dayKey)
    : -1;
  const selectedDailyDelta = selected && selectedPosition > 0
    ? selected.dailyScore - data[selectedPosition - 1].dailyScore
    : null;
  const weekDelta = data.length > 7 && latest
    ? latest.trendScore - data[data.length - 8].trendScore
    : null;
  const weakest = selected
    ? alignmentComponentScores(selected, mode)
        .filter(({ score }) => score > 0.03)
        .reduce<ReturnType<typeof alignmentComponentScores>[number] | null>(
          (current, component) => !current || component.score < current.score ? component : current,
          null,
        )
    : null;
  const streaks = targetStreaks(data);

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {mode === 'score' ? 'Sleep Alignment Score' : 'Core Sleep Score'}
        </Text>
        <Text style={[styles.latestScore, { color: theme.actionPrimary }]}>
          {formatScore(latest?.trendScore)}
        </Text>
      </View>
      <View style={styles.insights}>
        <AlignmentInsight
          color={theme.actionPrimary}
          subtitle={formatSignedScore(selectedDailyDelta)}
          title="DAILY"
          value={formatScore(selected?.dailyScore)}
        />
        <AlignmentInsight
          color={trendColor(weekDelta, theme)}
          subtitle={trendDirection(weekDelta)}
          title="TREND"
          value={formatScore(selected?.trendScore)}
        />
        <AlignmentInsight
          color={componentColor(weakest?.id, theme)}
          subtitle={weakest ? formatScore(weakest.score * 100) : '-'}
          title="MAIN DRAG"
          value={weakest?.title ?? '-'}
        />
        <AlignmentStreak current={streaks.current} best={streaks.best} />
      </View>
    </>
  );
}

export function AlignmentCardSelection({
  mode,
  selected,
}: {
  mode: AlignmentCardMode;
  selected: AlignmentChartPoint;
}) {
  const { theme } = useTheme();
  const components = alignmentComponentScores(selected, mode);
  return (
    <>
      <View style={styles.selectionFooter}>
        <Text style={[styles.footerDate, { color: theme.textSecondary }]}>{formatLongDate(selected.date)}</Text>
        <View style={styles.footerScoreGroup}>
          <Text style={[styles.footerScore, { color: theme.textPrimary }]}>Score {formatScore(selected.dailyScore)}</Text>
          <Text style={[styles.footerSeparator, { color: theme.textSecondary }]}>•</Text>
          <Text style={[styles.footerDelta, { color: selected.dailyScore >= targetScore ? theme.success : theme.warning }]}>
            {formatSignedScore(selected.dailyScore - targetScore)} vs target
          </Text>
        </View>
      </View>
      <View style={styles.components}>
        {components.map((component) => (
          <AlignmentComponentRow
            color={componentColor(component.id, theme)}
            ignored={component.score <= 0.03}
            key={component.id}
            score={component.score}
            title={component.title}
          />
        ))}
      </View>
    </>
  );
}

function AlignmentInsight({
  color,
  subtitle,
  title,
  value,
}: {
  color: string;
  subtitle: string;
  title: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.insight, { backgroundColor: theme.actionSecondary }]}>
      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[styles.insightTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text numberOfLines={1} style={[styles.insightValue, { color }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.insightSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

function AlignmentStreak({ best, current }: { best: number; current: number }) {
  const { theme } = useTheme();
  return (
    <View accessibilityLabel={`${current} day score streak, best ${best} days`} style={[styles.insight, { backgroundColor: theme.actionSecondary }]}>
      <View style={styles.streakValue}>
        <PlatformSymbol androidName="flame" color={theme.warning} size={17} symbol="flame.fill" />
        <Text style={[styles.streakNumber, { color: theme.warning }]}>{current}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.insightSubtitle, { color: theme.textSecondary }]}>
        {best > 0 ? `best ${best}d` : 'hit 70+'}
      </Text>
    </View>
  );
}

function AlignmentComponentRow({
  color,
  ignored,
  score,
  title,
}: {
  color: string;
  ignored: boolean;
  score: number;
  title: string;
}) {
  const { theme } = useTheme();
  return (
    <View accessibilityLabel={`${title}, ${ignored ? 'ignored' : formatScore(score * 100)}`} style={styles.componentRow}>
      <Text style={[styles.componentTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.actionSecondary }]}>
        <View style={[styles.progressFill, { backgroundColor: color, opacity: ignored ? 0.45 : 1, width: `${Math.max(0, Math.min(100, score * 100))}%` }]} />
      </View>
      <Text style={[styles.componentValue, { color: ignored ? theme.textSecondary : theme.textPrimary }]}>
        {ignored ? 'Ignored' : formatScore(score * 100)}
      </Text>
    </View>
  );
}

function targetStreaks(data: readonly AlignmentChartPoint[]): { best: number; current: number } {
  let best = 0;
  let running = 0;
  for (const point of data) {
    if (point.dailyScore >= targetScore) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }
  return { best, current: running };
}

function trendDirection(delta: number | null): string {
  if (delta === null) return 'Need >7 nights';
  if (delta > 1) return 'Improving';
  if (delta < -1) return 'Declining';
  return 'Stable';
}

function trendColor(delta: number | null, theme: ReturnType<typeof useTheme>['theme']): string {
  if (delta === null) return theme.textSecondary;
  if (delta > 1) return theme.success;
  if (delta < -1) return '#ff453a';
  return theme.warning;
}

function componentColor(
  component: 'duration' | 'timing' | 'phase' | 'consistency' | undefined,
  theme: ReturnType<typeof useTheme>['theme'],
): string {
  if (component === 'timing') return theme.success;
  if (component === 'phase') return '#7b7cff';
  if (component === 'consistency') return theme.warning;
  return theme.actionPrimary;
}

function formatScore(value: number | undefined): string {
  return value === undefined ? '-' : `${Math.round(value)}`;
}

function formatSignedScore(value: number | null): string {
  if (value === null) return '-';
  const rounded = Math.round(value);
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

function formatLongDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp);
}

const styles = StyleSheet.create({
  componentRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  componentTitle: { fontSize: 12, fontWeight: '600', width: 82 },
  componentValue: { fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700', textAlign: 'right', width: 48 },
  components: { gap: 8, paddingTop: 2 },
  footerDate: { fontSize: 12 },
  footerDelta: { fontSize: 12, fontWeight: '700' },
  footerScore: { fontSize: 12, fontWeight: '700' },
  footerScoreGroup: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  footerSeparator: { fontSize: 12 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  insight: { borderRadius: 12, flex: 1, minHeight: 62, paddingHorizontal: 9, paddingVertical: 8 },
  insightSubtitle: { fontSize: 9, marginTop: 2 },
  insightTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 0.35 },
  insightValue: { fontSize: 11, fontWeight: '800', letterSpacing: -0.2, marginTop: 4 },
  insights: { flexDirection: 'row', gap: 8 },
  latestScore: { fontSize: 17, fontWeight: '700' },
  progressFill: { borderRadius: 2, height: 5 },
  progressTrack: { borderRadius: 2, flex: 1, height: 5, overflow: 'hidden' },
  selectionFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  streakNumber: { fontSize: 18, fontVariant: ['tabular-nums'], fontWeight: '800' },
  streakValue: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 7 },
  title: { fontSize: 17, fontWeight: '700' },
});
