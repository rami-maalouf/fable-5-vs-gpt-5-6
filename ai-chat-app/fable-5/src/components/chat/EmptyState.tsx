import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

// fresh-conversation empty state, chatgpt-style centered prompt
export function EmptyState() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>What can I help with?</Text>
      <Text style={styles.subtitle}>Messages are saved on this device.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.label,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.tertiaryLabel,
    textAlign: 'center',
  },
});
