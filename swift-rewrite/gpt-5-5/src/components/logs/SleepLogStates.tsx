import { Pressable, StyleSheet, Text } from 'react-native';

import { CardBackground } from '@/components/common';
import { Spacing } from '@/constants/theme';
import type { AppTheme } from '@/theme';

export function EmptyState({ loading, theme }: { loading: boolean; theme: AppTheme }) {
  return (
    <CardBackground theme={theme} style={styles.emptyCard}>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{loading ? 'Loading logs' : 'No sleep logs yet'}</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
        {loading ? 'Fetching your saved sleep sessions.' : 'Tap plus to add a manual sleep log after task 13 lands.'}
      </Text>
    </CardBackground>
  );
}

export function ErrorState({ onRetry, theme }: { onRetry: () => void; theme: AppTheme }) {
  return (
    <CardBackground theme={theme} style={styles.emptyCard}>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Could not load logs</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Try again before adding or editing sessions.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, { backgroundColor: theme.actionPrimary }, pressed && styles.pressed]}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </CardBackground>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    marginHorizontal: 0,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 14,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
