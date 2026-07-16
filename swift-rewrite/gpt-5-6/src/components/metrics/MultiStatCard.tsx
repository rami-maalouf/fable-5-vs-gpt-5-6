// ports: twilight/components/common/multistatcard.swift

import { StyleSheet, Text, View } from 'react-native';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import type { MetricsStat } from '@/components/metrics/metrics-screen-model';
import { useTheme } from '@/theme/ThemeProvider';

const iconByStat: Record<MetricsStat['id'], { android: Parameters<typeof PlatformSymbol>[0]['androidName']; sf: string }> = {
  averageDuration: { android: 'time', sf: 'clock.fill' },
  bestStreak: { android: 'trophy', sf: 'crown.fill' },
  currentStreak: { android: 'flame', sf: 'flame.fill' },
  dataCoverage: { android: 'stats-chart', sf: 'chart.bar.xaxis' },
  debtCredit: { android: 'scale', sf: 'scale.3d' },
  goalHitRate: { android: 'locate', sf: 'target' },
  longestNight: { android: 'arrow-up-circle', sf: 'arrow.up.circle.fill' },
  shortestNight: { android: 'arrow-down-circle', sf: 'arrow.down.circle.fill' },
  totalSleep: { android: 'bed', sf: 'bed.double.fill' },
  trackedNights: { android: 'moon', sf: 'moon.stars.fill' },
};

export function MultiStatCard({ stats }: { stats: readonly MetricsStat[] }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      {stats.map((stat) => {
        const icon = iconByStat[stat.id];
        const iconColor = statColor(stat, theme);
        return (
          <View accessibilityLabel={`${stat.label}, ${stat.value}`} key={stat.id} style={styles.stat}>
            <PlatformSymbol androidName={icon.android} color={iconColor} size={20} symbol={icon.sf} />
            <View style={styles.copy}>
              <Text numberOfLines={1} style={[styles.label, { color: theme.textSecondary }]}>{stat.label}</Text>
              <Text numberOfLines={1} style={[styles.value, { color: theme.textPrimary }]}>{stat.value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function statColor(stat: MetricsStat, theme: ReturnType<typeof useTheme>['theme']): string {
  switch (stat.id) {
    case 'averageDuration':
    case 'longestNight':
      return theme.success;
    case 'bestStreak':
      return '#ffd60a';
    case 'currentStreak':
      return '#ff453a';
    case 'dataCoverage':
      return '#30d5c8';
    case 'debtCredit':
      return stat.value.startsWith('-') ? '#ff453a' : theme.success;
    case 'goalHitRate':
    case 'shortestNight':
      return theme.warning;
    case 'totalSleep':
    case 'trackedNights':
      return theme.actionPrimary;
  }
}

const styles = StyleSheet.create({
  card: { borderColor: 'rgba(142,142,147,0.3)', borderRadius: 24, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  copy: { flex: 1, gap: 4 },
  label: { fontSize: 12, lineHeight: 16 },
  stat: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, minHeight: 64, padding: 7, width: '50%' },
  value: { fontSize: 19, fontWeight: '700', lineHeight: 24 },
});
