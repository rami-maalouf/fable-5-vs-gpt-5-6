import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type ErrorRowProps = {
  // present only when this error is retryable (the newest turn)
  onRetry?: () => void;
};

// readable inline error beneath a (partial) reply, with a retry affordance
export function ErrorRow({ onRetry }: ErrorRowProps) {
  return (
    <View style={styles.container}>
      <SymbolView
        name="exclamationmark.circle.fill"
        size={16}
        tintColor={colors.destructive}
        fallback={null}
      />
      <Text style={styles.text}>Something went wrong.</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  text: {
    fontSize: 14,
    color: colors.secondaryLabel,
  },
  retry: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.control,
    backgroundColor: colors.fill,
  },
  retryPressed: {
    opacity: 0.6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.label,
  },
});
