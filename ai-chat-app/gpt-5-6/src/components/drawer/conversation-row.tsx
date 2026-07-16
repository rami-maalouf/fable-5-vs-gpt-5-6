import { Pressable, StyleSheet, Text } from 'react-native';

import type { ConversationRecord } from '@/lib/db';
import { colors } from '@/theme/colors';

type ConversationRowProps = {
  conversation: ConversationRecord;
  isActive: boolean;
  onPress: () => void;
};

export function ConversationRow({
  conversation,
  isActive,
  onPress,
}: ConversationRowProps) {
  return (
    <Pressable
      accessibilityLabel={`Open conversation: ${conversation.title}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
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
