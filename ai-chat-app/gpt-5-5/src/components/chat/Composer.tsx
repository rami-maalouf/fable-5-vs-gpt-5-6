import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { spacing, useNovaTheme } from '@/theme';

type ComposerProps = {
  isGenerating: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
};

const MAX_INPUT_HEIGHT = 128;

export const CHAT_INPUT_NATIVE_ID = 'nova-chat-input';

export function Composer({ isGenerating, onSend, onStop }: ComposerProps) {
  const theme = useNovaTheme();
  const [content, setContent] = useState('');
  const trimmedContent = content.trim();
  const canSend = trimmedContent.length > 0 && !isGenerating;

  const send = () => {
    if (!canSend) {
      return;
    }

    const message = trimmedContent;
    setContent('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(message);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.elevated,
          borderColor: theme.colors.separator,
        },
      ]}
    >
      <TextInput
        accessibilityLabel="message input"
        editable={!isGenerating}
        multiline
        nativeID={CHAT_INPUT_NATIVE_ID}
        onChangeText={setContent}
        placeholder="Message Nova"
        placeholderTextColor={theme.colors.tertiaryText}
        returnKeyType="default"
        scrollEnabled
        style={[
          styles.input,
          {
            color: theme.colors.text,
            maxHeight: MAX_INPUT_HEIGHT,
          },
        ]}
        textAlignVertical="center"
        value={content}
      />
      {isGenerating ? (
        <Pressable
          accessibilityLabel="stop generating"
          accessibilityRole="button"
          onPress={onStop}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.text,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <SymbolView name="stop.fill" size={14} tintColor={theme.colors.background} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={send}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: canSend ? theme.colors.accent : theme.colors.disabledFill,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <SymbolView
            name="arrow.up"
            size={18}
            tintColor={canSend ? '#ffffff' : theme.colors.secondaryText}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 56,
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: spacing.sm,
    fontSize: 16,
    lineHeight: 20,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
