import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ChatModel } from '@/lib/chat-stream';
import { colors } from '@/theme/colors';

const MODEL_OPTIONS: { label: string; value: ChatModel }[] = [
  { label: 'Luna', value: 'gpt-5.6-luna' },
  { label: 'Sol', value: 'gpt-5.6-sol' },
  { label: 'Terra', value: 'gpt-5.6-terra' },
];

type ModelPickerProps = {
  disabled: boolean;
  model: ChatModel;
  onSelect: (model: ChatModel) => Promise<boolean>;
};

function getModelLabel(model: ChatModel) {
  return MODEL_OPTIONS.find((option) => option.value === model)?.label ?? 'Luna';
}

export function ModelPicker({ disabled, model, onSelect }: ModelPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const currentLabel = getModelLabel(model);
  const isDisabled = disabled || isSelecting;

  const select = async (nextModel: ChatModel) => {
    if (nextModel === model || isDisabled) {
      return;
    }

    setIsSelecting(true);
    const didSelect = await onSelect(nextModel);
    setIsSelecting(false);

    if (!didSelect) {
      Alert.alert('Could not change model.', 'Please try again.');
    }
  };

  const openPicker = () => {
    if (isDisabled) {
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 0,
          message: `Current model: ${currentLabel}`,
          options: ['Cancel', ...MODEL_OPTIONS.map((option) => option.label)],
          title: 'Choose model',
        },
        (buttonIndex) => {
          const option = MODEL_OPTIONS[buttonIndex - 1];
          if (option) {
            void select(option.value);
          }
        },
      );
      return;
    }

    Alert.alert(
      'Choose model',
      `Current model: ${currentLabel}`,
      MODEL_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => void select(option.value),
      })),
    );
  };

  return (
    <Pressable
      accessibilityLabel={`Model: ${currentLabel}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={openPicker}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.brand}>Nova</Text>
      <View style={styles.modelLabel}>
        <Text style={styles.model}>{currentLabel}</Text>
        <SymbolView
          name={{
            android: 'keyboard_arrow_down',
            ios: 'chevron.down',
            web: 'keyboard_arrow_down',
          }}
          size={10}
          tintColor={colors.secondaryLabel as string}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.label,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
  },
  disabled: {
    opacity: 0.55,
  },
  model: {
    color: colors.secondaryLabel,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
  },
  modelLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pressed: {
    opacity: 0.55,
  },
});
