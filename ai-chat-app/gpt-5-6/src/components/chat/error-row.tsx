import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type ErrorRowProps = {
  onRetry: () => void;
};

export function ErrorRow({ onRetry }: ErrorRowProps) {
  return (
    <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.container}>
      <View style={styles.message}>
        <SymbolView
          name="exclamationmark.circle.fill"
          size={17}
          tintColor={colors.error as string}
        />
        <Text style={styles.text}>Nova could not finish the response. Check your connection.</Text>
      </View>
      <Pressable
        accessibilityLabel="Retry response"
        accessibilityRole="button"
        hitSlop={4}
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}>
        <SymbolView name="arrow.clockwise" size={15} tintColor={colors.accent as string} />
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 4,
  },
  message: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  text: {
    color: colors.secondaryLabel,
    flexShrink: 1,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 19,
  },
  retry: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 2,
  },
  retryPressed: {
    opacity: 0.5,
  },
  retryText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
