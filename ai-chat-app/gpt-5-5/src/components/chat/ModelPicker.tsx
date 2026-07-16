import { MenuView } from '@expo/ui/community/menu';
import type { MenuAction } from '@expo/ui/community/menu';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { CHAT_MODELS, isChatModel } from '@/domain';
import type { ChatModel } from '@/domain';
import { spacing, useNovaTheme } from '@/theme';

type ModelPickerProps = {
  model: ChatModel;
  onChange: (model: ChatModel) => void;
};

function createModelActions(currentModel: ChatModel): MenuAction[] {
  return CHAT_MODELS.map((model) => ({
    id: model,
    state: model === currentModel ? 'on' : 'off',
    title: model,
  }));
}

export function ModelPicker({ model, onChange }: ModelPickerProps) {
  const theme = useNovaTheme();

  return (
    <MenuView
      actions={createModelActions(model)}
      onPressAction={({ nativeEvent }) => {
        const nextModel = nativeEvent.event;

        if (!isChatModel(nextModel) || nextModel === model) {
          return;
        }

        onChange(nextModel);
      }}
      testID="model-picker-menu"
      title="Model"
    >
      <View
        accessibilityLabel="select model"
        accessibilityRole="button"
        style={styles.trigger}
      >
        <Text style={[styles.label, { color: theme.colors.secondaryText }]}>
          {model}
        </Text>
        <SymbolView
          name="chevron.down"
          size={10}
          tintColor={theme.colors.secondaryText}
        />
      </View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 22,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
