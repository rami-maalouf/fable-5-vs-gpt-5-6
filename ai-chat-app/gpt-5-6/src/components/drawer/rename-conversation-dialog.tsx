import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ConversationRecord } from '@/lib/db';
import { colors } from '@/theme/colors';

type RenameConversationDialogProps = {
  conversation: ConversationRecord;
  onCancel: () => void;
  onSave: (title: string) => Promise<boolean>;
};

export function RenameConversationDialog({
  conversation,
  onCancel,
  onSave,
}: RenameConversationDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [shouldSelectTitle, setShouldSelectTitle] = useState(true);
  const [title, setTitle] = useState(conversation.title);

  const normalizedTitle = title.trim();
  const save = async () => {
    if (!normalizedTitle || isSaving) {
      return;
    }

    setIsSaving(true);
    const didSave = await onSave(normalizedTitle);
    if (!didSave) {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      presentationStyle="overFullScreen"
      transparent
      visible>
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <Pressable
          accessibilityLabel="Cancel renaming conversation"
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text style={styles.title}>Rename conversation</Text>
          <TextInput
            accessibilityLabel="Conversation title"
            autoFocus
            maxLength={80}
            onChangeText={(value) => {
              setShouldSelectTitle(false);
              setTitle(value);
            }}
            onSubmitEditing={() => void save()}
            returnKeyType="done"
            selectionColor={colors.accent}
            selection={
              shouldSelectTitle
                ? { start: 0, end: conversation.title.length }
                : undefined
            }
            style={styles.input}
            value={title}
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onCancel}
              style={styles.actionButton}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!normalizedTitle || isSaving}
              onPress={() => void save()}
              style={styles.actionButton}>
              <Text
                style={[
                  styles.saveLabel,
                  (!normalizedTitle || isSaving) && styles.disabledLabel,
                ]}>
                Rename
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    opacity: 0.36,
  },
  cancelLabel: {
    color: colors.secondaryLabel,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
  },
  dialog: {
    alignSelf: 'stretch',
    backgroundColor: colors.background,
    borderRadius: 8,
    marginHorizontal: 32,
    maxWidth: 360,
    padding: 16,
  },
  disabledLabel: {
    opacity: 0.35,
  },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 6,
    color: colors.label,
    fontSize: 16,
    height: 44,
    letterSpacing: 0,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  keyboardAvoidingView: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  saveLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  title: {
    color: colors.label,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
