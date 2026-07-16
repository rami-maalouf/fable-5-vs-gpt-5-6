import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nova',
          headerShadowVisible: false,
        }}
      />
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nova</Text>
        <Text style={styles.emptySubtitle}>Ask anything to get started.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.label,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.secondaryLabel,
  },
});
