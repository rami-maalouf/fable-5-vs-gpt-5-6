import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, useColorScheme } from 'react-native';

import { colors, minTouchTarget, spacing } from '@/theme/tokens';

type ComposerProps = {
  // true from send until the reply finishes/stops/errors
  generating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

const MAX_INPUT_HEIGHT = 120;

export function Composer({ generating, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState('');
  const colorScheme = useColorScheme();
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !generating;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // clear immediately; the text is never restored, even on error
    setText('');
    onSend(trimmed);
  }, [canSend, onSend, trimmed]);

  // send/stop glyph must contrast with the label-colored circle
  const glyphColor = colorScheme === 'dark' ? '#000000' : '#ffffff';

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <TextInput
          testID="composer-input"
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message Nova"
          placeholderTextColor={colors.tertiaryLabel}
          multiline
          keyboardAppearance="default"
          accessibilityLabel="Message Nova"
        />
        {generating ? (
          <Pressable
            testID="composer-stop"
            onPress={onStop}
            style={styles.actionButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
          >
            <View style={styles.actionCircle}>
              <SymbolView
                name="stop.fill"
                size={14}
                tintColor={glyphColor}
                fallback={null}
              />
            </View>
          </Pressable>
        ) : (
          <Pressable
            testID="composer-send"
            onPress={handleSend}
            disabled={!canSend}
            style={styles.actionButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <View style={[styles.actionCircle, !canSend && styles.actionCircleDisabled]}>
              <SymbolView
                name="arrow.up"
                size={16}
                weight="semibold"
                tintColor={glyphColor}
                fallback={null}
              />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    maxHeight: MAX_INPUT_HEIGHT,
    color: colors.label,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: spacing.sm,
  },
  actionButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    // keep the visual circle small but the target >= 44pt via hitSlop
    maxHeight: minTouchTarget,
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleDisabled: {
    opacity: 0.25,
  },
});
