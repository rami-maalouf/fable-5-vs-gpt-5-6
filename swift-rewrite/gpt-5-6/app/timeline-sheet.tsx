// ports: twilight/views/sleepmetricsview.swift

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import { METRICS_RANGES, type MetricsRange } from '@/components/metrics/metrics-screen-model';
import { useTheme } from '@/theme/ThemeProvider';

const screenOptions = {
  headerShown: false,
  presentation: 'formSheet',
  sheetAllowedDetents: [0.82, 1] as number[],
  sheetGrabberVisible: true,
  sheetInitialDetentIndex: 0,
} as const;

export default function TimelineSheetRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const parameters = useLocalSearchParams<{ range?: string }>();
  const range: MetricsRange = METRICS_RANGES.includes(parameters.range as MetricsRange)
    ? parameters.range as MetricsRange
    : '90D';

  return (
    <ScreenBackground>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView accessibilityLabel="Sleep and wake timeline" style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Sleep & Wake Timeline</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{range} timing window</Text>
          </View>
          <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={() => router.back()}>
            <PlatformSymbol androidName="close-circle" color={theme.textSecondary} size={28} symbol="xmark.circle.fill" />
          </Pressable>
        </View>
        <View style={[styles.chartShell, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.legendRow}>
            <TimelineLegend color="#7b68ee" icon="moon.fill" label="Bedtime" />
            <TimelineLegend color="#ffb347" icon="sun.max.fill" label="Wake time" />
          </View>
          <View style={[styles.rule, { backgroundColor: theme.actionSecondary }]} />
          <Text style={[styles.detail, { color: theme.textSecondary }]}>Night-by-night timing will appear here.</Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function TimelineLegend({ color, icon, label }: { color: string; icon: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.legend}>
      <PlatformSymbol androidName={label === 'Bedtime' ? 'moon' : 'sunny'} color={color} size={17} symbol={icon} />
      <Text style={[styles.legendText, { color: theme.textPrimary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chartShell: { borderColor: 'rgba(142,142,147,0.3)', borderRadius: 24, borderWidth: 1, gap: 24, marginTop: 26, minHeight: 260, padding: 20 },
  detail: { fontSize: 14, textAlign: 'center' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  legend: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  legendRow: { flexDirection: 'row', gap: 22 },
  legendText: { fontSize: 13, fontWeight: '700' },
  rule: { borderRadius: 2, height: 4 },
  safeArea: { flex: 1, padding: 20 },
  subtitle: { fontSize: 14, marginTop: 4 },
  title: { fontSize: 25, fontWeight: '800' },
});
