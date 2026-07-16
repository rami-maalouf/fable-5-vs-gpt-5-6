import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useChatStream } from '@/hooks/useChatStream';
import { colors, spacing } from '@/theme/tokens';

// temporary debug harness for the task-3 streaming spike; replaced by the
// real chat ui in tasks 4-5
export default function ChatScreen() {
  const { stream, stop } = useChatStream();
  const [output, setOutput] = useState('');
  const [state, setState] = useState<'idle' | 'streaming'>('idle');

  const runSpike = useCallback(async () => {
    setOutput('');
    setState('streaming');
    const result = await stream(
      [{ role: 'user', content: 'hey nova, introduce yourself' }],
      'gpt-5.6-luna',
      { onText: setOutput },
    );
    setState('idle');
    setOutput(
      (prev) =>
        `${prev}\n\n[outcome: ${result.outcome}]${result.error ? `\n[error: ${result.error.message}]` : ''}`,
    );
  }, [stream]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Nova', headerShadowVisible: false }} />
      <ScrollView style={styles.output} contentContainerStyle={styles.outputContent}>
        <Text style={styles.outputText}>{output || 'Ask anything to get started.'}</Text>
      </ScrollView>
      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={state === 'idle' ? runSpike : stop}
          accessibilityRole="button"
        >
          <Text style={styles.buttonLabel}>{state === 'idle' ? 'Stream test' : 'Stop'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  output: {
    flex: 1,
  },
  outputContent: {
    padding: spacing.lg,
  },
  outputText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.label,
  },
  buttons: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.fill,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
});
