import { Host, Menu, Picker, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundColor, frame, tag } from '@expo/ui/swift-ui/modifiers';
import { useCallback } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { getDb } from '@/data/client-db';
import { setConversationModel } from '@/data/conversation-repo';
import { MODEL_ALLOWLIST, isAllowedModel } from '@/domain/models';
import { useChatStore } from '@/state/chat-store';

// header title: shows the active conversation's model; tapping opens a native
// pull-down menu with exactly the three allowlisted models
export function ModelPicker() {
  const model = useChatStore((s) => s.model);
  const colorScheme = useColorScheme();
  const labelColor = colorScheme === 'dark' ? '#ffffff' : '#000000';

  const onSelect = useCallback((selection: string | null) => {
    if (!isAllowedModel(selection)) return;
    useChatStore.getState().setModel(selection);
    const conversationId = useChatStore.getState().conversationId;
    if (conversationId) {
      void (async () => {
        const db = await getDb();
        await setConversationModel(db, conversationId, selection);
      })();
    }
  }, []);

  return (
    <Host style={styles.host}>
      <Menu
        label={
          <VStack>
            <Text modifiers={[font({ size: 17, weight: 'semibold' }), foregroundColor(labelColor)]}>
              Nova
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundColor('#8E8E93')]}>{model}</Text>
          </VStack>
        }
      >
        <Picker selection={model} onSelectionChange={onSelect}>
          {MODEL_ALLOWLIST.map((m) => (
            <Text key={m} modifiers={[tag(m)]}>
              {m}
            </Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    width: 220,
    height: 44,
  },
});
