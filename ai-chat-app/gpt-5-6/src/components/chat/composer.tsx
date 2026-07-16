import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';

type ComposerProps = {
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Composer({ isGenerating, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !isGenerating;

  const submit = () => {
    if (!canSend) {
      return;
    }

    const message = text;
    setText('');
    onSend(message);

    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Message Nova"
        multiline
        onChangeText={setText}
        placeholder="Message Nova"
        placeholderTextColor={colors.placeholder}
        returnKeyType="default"
        selectionColor={colors.accent}
        style={styles.input}
        submitBehavior="newline"
        value={text}
      />
      <Pressable
        accessibilityLabel={isGenerating ? 'Stop generation' : 'Send message'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isGenerating && !canSend }}
        disabled={!isGenerating && !canSend}
        hitSlop={4}
        onPress={isGenerating ? onStop : submit}
        style={({ pressed }) => [
          styles.action,
          !isGenerating && !canSend && styles.actionDisabled,
          pressed && styles.actionPressed,
        ]}>
        <SymbolView
          name={isGenerating ? 'stop.fill' : 'arrow.up'}
          size={18}
          tintColor={colors.background as string}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderColor: colors.separator,
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 8,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    color: colors.label,
    flex: 1,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 21,
    maxHeight: 112,
    minHeight: 36,
    paddingBottom: 7,
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.label,
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionDisabled: {
    opacity: 0.22,
  },
  actionPressed: {
    opacity: 0.7,
  },
});
