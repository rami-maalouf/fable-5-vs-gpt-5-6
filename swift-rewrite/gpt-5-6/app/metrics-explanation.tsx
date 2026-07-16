import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

const screenOptions = {
  headerShown: false,
  presentation: 'formSheet',
  sheetAllowedDetents: [0.6, 1] as number[],
  sheetGrabberVisible: true,
  sheetInitialDetentIndex: 0,
} as const;

const metrics = [
  ['Week', 'A seven-night view of duration, bedtime rhythm, wake rhythm, and target accuracy.'],
  ['7-Night Avg', 'A rolling average that quiets one-off nights and reveals direction.'],
  ['Score', 'Alignment combines duration, timing, sleep phase, and consistency into a 0 to 100 score.'],
  ['Core', 'A focused blend of sleep duration and schedule consistency.'],
] as const;

export default function MetricsExplanationRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };
  return (
    <ScreenBackground>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Your sleep metrics</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Patterns, not perfection.</Text>
          </View>
          <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={close}>
            <SymbolView name="xmark.circle.fill" size={28} tintColor={theme.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {metrics.map(([title, copy]) => (
            <View key={title} style={[styles.metric, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>{title}</Text>
              <Text style={[styles.metricCopy, { color: theme.textSecondary }]}>{copy}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 30, paddingHorizontal: 18 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  metric: { borderRadius: 18, padding: 16 },
  metricCopy: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  metricTitle: { fontSize: 17, fontWeight: '800' },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 14, marginTop: 3 },
  title: { fontSize: 26, fontWeight: '800' },
});
