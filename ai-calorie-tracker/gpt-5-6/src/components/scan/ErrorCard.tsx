import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNourishTheme } from '@/theme/tokens';

type ScanErrorKind = 'not-food' | 'network' | 'analysis';

type ErrorCardProps = {
  kind: ScanErrorKind;
  onDiscard: () => void;
  onRetryAnalysis: () => void;
  onTryAnother: () => void;
};

const errorCopy = {
  'not-food': {
    title: "We couldn't find food",
    body: 'Choose another photo with the whole meal clearly in frame.',
    action: 'Try another photo',
  },
  network: {
    title: 'Connection interrupted',
    body: 'Your photo is ready. Reconnect, then try the same image again.',
    action: 'Retry analysis',
  },
  analysis: {
    title: 'Analysis unavailable',
    body: 'Your photo is ready. Try the same image again in a moment.',
    action: 'Retry analysis',
  },
} as const;

export function ErrorCard({
  kind,
  onDiscard,
  onRetryAnalysis,
  onTryAnother,
}: ErrorCardProps) {
  const theme = useNourishTheme();
  const copy = errorCopy[kind];
  const recover = kind === 'not-food' ? onTryAnother : onRetryAnalysis;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.eyebrow, { color: theme.coral }]}>SCAN PAUSED</Text>
        <Text style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>{copy.body}</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Discard"
            accessibilityRole="button"
            onPress={onDiscard}
            style={({ pressed }) => [
              styles.discardButton,
              {
                borderColor: theme.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}>
            <Text style={[styles.discardLabel, { color: theme.text }]}>Discard</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.action}
            accessibilityRole="button"
            onPress={recover}
            style={({ pressed }) => [
              styles.recoveryButton,
              {
                backgroundColor: pressed ? theme.coralPressed : theme.coral,
              },
            ]}>
            <Text style={[styles.recoveryLabel, { color: theme.onAccent }]}>
              {copy.action}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  card: {
    borderRadius: 28,
    padding: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 31,
    marginTop: 7,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  discardButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  discardLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  recoveryButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1.7,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  recoveryLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
