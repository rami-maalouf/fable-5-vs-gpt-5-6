// today's dashboard: rendered entirely from derived day selectors.
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealList } from '@/components/dashboard/MealList';
import { NutritionSummary } from '@/components/dashboard/NutritionSummary';
import { ScanButton } from '@/components/dashboard/ScanButton';
import { useDay } from '@/state/day-context';
import { spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';

export default function DashboardScreen() {
  const { meals, summary } = useDay();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleScanPress = useCallback(() => {
    router.push('/scan');
  }, [router]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + 112,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            style={[styles.wordmark, { color: colors.accent }]}
          >
            Nourish
          </Text>
          <Text style={[styles.today, { color: colors.textPrimary }]}>
            Today
          </Text>
        </View>
        <NutritionSummary summary={summary} />
        <MealList meals={meals} />
      </ScrollView>
      <View
        pointerEvents="none"
        style={[
          styles.statusBarScrim,
          { height: insets.top, backgroundColor: colors.background },
        ]}
      />
      <View
        pointerEvents="box-none"
        style={[styles.scanArea, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <ScanButton onPress={handleScanPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  wordmark: {
    ...typeScale.title,
    fontSize: 20,
  },
  today: {
    ...typeScale.largeTitle,
    marginTop: spacing.xs,
  },
  // keeps scrolled content from colliding with the status bar clock
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scanArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
});
