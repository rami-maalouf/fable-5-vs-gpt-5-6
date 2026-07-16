import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Message Nova"
        multiline
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder="Message Nova"
        returnKeyType="send"
        style={styles.input}
        submitBehavior="blurAndSubmit"
        value={text}
      />
      <Pressable
        accessibilityLabel={isGenerating ? 'Stop generation' : 'Send message'}
        accessibilityRole="button"
        disabled={!isGenerating && !canSend}
        onPress={isGenerating ? onStop : submit}
        style={({ pressed }) => [
          styles.action,
          !isGenerating && !canSend && styles.actionDisabled,
          pressed && styles.actionPressed,
        ]}>
        <SymbolView
          name={isGenerating ? 'stop.fill' : 'arrow.up'}
          size={18}
          tintColor="#ffffff"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    borderColor: '#d7d7d7',
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
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    maxHeight: 120,
    minHeight: 36,
    paddingTop: 8,
  },
  action: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionDisabled: {
    opacity: 0.25,
  },
  actionPressed: {
    opacity: 0.7,
  },
});
