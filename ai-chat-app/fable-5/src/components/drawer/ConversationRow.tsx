import { Button, ContextMenu, Host, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, frame, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Conversation } from '@/domain/messages';
import { colors, radius } from '@/theme/tokens';

type ConversationRowProps = {
  conversation: Conversation;
  isActive: boolean;
  onPress: (conversation: Conversation) => void;
  onRename: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
};

// row with a real ios context menu: swiftui ContextMenu via @expo/ui.
// tap opens the conversation, long-press shows rename/delete.
export const ConversationRow = memo(function ConversationRow({
  conversation,
  isActive,
  onPress,
  onRename,
  onDelete,
}: ConversationRowProps) {
  return (
    <View style={[styles.row, isActive && styles.rowActive]}>
      <Host style={styles.host}>
        <ContextMenu>
          <ContextMenu.Items>
            <Button
              label="Rename"
              systemImage="pencil"
              onPress={() => onRename(conversation)}
            />
            <Button
              label="Delete"
              systemImage="trash"
              role="destructive"
              onPress={() => onDelete(conversation)}
            />
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <Button onPress={() => onPress(conversation)} modifiers={[buttonStyle('plain')]}>
              <Text
                modifiers={[
                  font({ size: 16 }),
                  lineLimit(1),
                  frame({ maxWidth: 9999, minHeight: 44, alignment: 'leading' }),
                  padding({ horizontal: 12 }),
                ]}
              >
                {conversation.title}
              </Text>
            </Button>
          </ContextMenu.Trigger>
        </ContextMenu>
      </Host>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.sheet,
    overflow: 'hidden',
  },
  rowActive: {
    backgroundColor: colors.fill,
  },
  host: {
    height: 44,
  },
});
