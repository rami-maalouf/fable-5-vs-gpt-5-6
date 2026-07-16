import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatStream } from '@/hooks/useChatStream';
import { MODEL_OPTIONS, spacing, useNovaTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useNovaTheme();
  const chatStream = useChatStream();

  const testAssistant = () => {
    void chatStream.send({
      messages: [
        {
          content: 'Introduce yourself in one short paragraph.',
          role: 'user',
        },
      ],
      model: MODEL_OPTIONS[0],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Pressable
            accessibilityLabel="open conversation history"
            accessibilityRole="button"
            style={[
              styles.iconButton,
              styles.leftHeaderButton,
              { backgroundColor: theme.colors.secondaryFill },
            ]}
          >
            <SymbolView name="sidebar.left" size={21} tintColor={theme.colors.text} />
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Nova</Text>
            <Text style={[styles.model, { color: theme.colors.secondaryText }]}>
              {MODEL_OPTIONS[0]}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="start new chat"
            accessibilityRole="button"
            style={[
              styles.iconButton,
              styles.rightHeaderButton,
              { backgroundColor: theme.colors.secondaryFill },
            ]}
          >
            <SymbolView name="square.and.pencil" size={21} tintColor={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            What should we explore?
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.secondaryText }]}>
            Start a conversation with Nova. Your history will live in the sidebar once
            there is something to save.
          </Text>
          <Pressable
            accessibilityLabel="test Nova stream"
            accessibilityRole="button"
            disabled={chatStream.isStreaming}
            onPress={testAssistant}
            style={({ pressed }) => [
              styles.debugButton,
              {
                backgroundColor: chatStream.isStreaming
                  ? theme.colors.disabledFill
                  : theme.colors.accent,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={styles.debugButtonText}>
              {chatStream.isStreaming ? 'Streaming...' : 'Ask Nova'}
            </Text>
          </Pressable>
          {(chatStream.text.length > 0 || chatStream.error != null) && (
            <View
              style={[
                styles.debugResponse,
                {
                  backgroundColor: theme.colors.secondaryFill,
                },
              ]}
            >
              <Text
                accessibilityLabel="Nova stream response"
                style={[styles.debugResponseText, { color: theme.colors.text }]}
              >
                {chatStream.error ?? chatStream.text}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.elevated,
              borderColor: theme.colors.separator,
            },
          ]}
        >
          <Text style={[styles.placeholder, { color: theme.colors.tertiaryText }]}>
            Message Nova
          </Text>
          <View style={[styles.sendButton, { backgroundColor: theme.colors.disabledFill }]}>
            <SymbolView name="arrow.up" size={18} tintColor={theme.colors.secondaryText} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  model: {
    fontSize: 12,
    lineHeight: 16,
  },
  iconButton: {
    position: 'absolute',
    top: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftHeaderButton: {
    left: spacing.md,
  },
  rightHeaderButton: {
    right: spacing.md,
  },
  emptyState: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    top: '38%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  debugButton: {
    marginTop: spacing.lg,
    minHeight: 42,
    minWidth: 112,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugResponse: {
    width: '100%',
    marginTop: spacing.md,
    borderRadius: 8,
    padding: spacing.md,
  },
  debugResponseText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'left',
  },
  composer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    minHeight: 52,
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
