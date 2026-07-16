// ports: twilight/views/sleepmetricsview.swift

import { StyleSheet, Text, View } from 'react-native';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import { useTheme } from '@/theme/ThemeProvider';

export function MetricsEmptyState({
  detail = 'Track a few nights and this tab will unlock trends, streaks, and long-range insights.',
  title = 'Not enough nights for metrics yet',
}: {
  detail?: string;
  title?: string;
}) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="summary" style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      <PlatformSymbol androidName="trending-up" color={theme.actionPrimary} size={44} symbol="chart.line.uptrend.xyaxis.circle.fill" />
      <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.detail, { color: theme.textSecondary }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderColor: 'rgba(142,142,147,0.3)', borderRadius: 24, borderWidth: 1, gap: 14, paddingHorizontal: 20, paddingVertical: 32 },
  detail: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
