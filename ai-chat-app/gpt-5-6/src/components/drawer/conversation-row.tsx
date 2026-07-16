import { StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import type { ConversationRecord } from '@/lib/db';
import { colors } from '@/theme/colors';

type ConversationRowProps = {
  conversation: ConversationRecord;
  isActive: boolean;
  onLongPress: () => void;
  onPress: () => void;
};

export function ConversationRow({
  conversation,
  isActive,
  onLongPress,
  onPress,
}: ConversationRowProps) {
  return (
    <Pressable
      accessibilityHint="Long press for rename and delete actions"
      accessibilityLabel={`Open conversation: ${conversation.title}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isActive && styles.activeRow,
        pressed && styles.pressedRow,
      ]}>
      <Text ellipsizeMode="tail" numberOfLines={1} style={styles.title}>
        {conversation.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeRow: {
    backgroundColor: colors.secondaryBackground,
  },
  pressedRow: {
    opacity: 0.6,
  },
  row: {
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  title: {
    color: colors.label,
    fontSize: 16,
    letterSpacing: 0,
  },
});
