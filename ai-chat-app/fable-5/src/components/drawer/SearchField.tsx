import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <SymbolView name="magnifyingglass" size={16} tintColor={colors.secondaryLabel} fallback={null} />
      <TextInput
        testID="drawer-search"
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor={colors.tertiaryLabel}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel="Search conversations"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.fill,
    borderRadius: radius.sheet,
    paddingHorizontal: spacing.md,
    height: 38,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.label,
  },
});
