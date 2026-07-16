import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useNovaTheme } from '@/theme';

type ErrorRowProps = {
  message?: string;
  onRetry: () => void;
};

const DEFAULT_ERROR_MESSAGE = 'Something went wrong while generating this reply.';

export function ErrorRow({ message = DEFAULT_ERROR_MESSAGE, onRetry }: ErrorRowProps) {
  const theme = useNovaTheme();

  return (
    <View
      accessibilityLabel="message error"
      style={[
        styles.container,
        {
          backgroundColor: theme.scheme === 'dark' ? '#3a1c1c' : '#fff2f2',
          borderColor: theme.scheme === 'dark' ? '#7f2a2a' : '#f4b4b4',
        },
      ]}
    >
      <Text style={[styles.message, { color: theme.scheme === 'dark' ? '#ffb4ab' : '#8c1d18' }]}>
        {message}
      </Text>
      <Pressable
        accessibilityLabel="retry response"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          { opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <Text style={[styles.retryText, { color: theme.colors.accent }]}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  message: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
});
