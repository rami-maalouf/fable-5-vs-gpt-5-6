import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

export function EmptyState() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <View style={styles.mark}>
        <SymbolView name="sparkles" size={20} tintColor={colors.label as string} />
      </View>
      <Text style={styles.title}>How can I help?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingBottom: 64,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: colors.label,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
