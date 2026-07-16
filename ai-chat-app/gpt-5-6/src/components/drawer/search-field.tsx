import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';

type SearchFieldProps = {
  onChangeText: (value: string) => void;
  value: string;
};

export function SearchField({ onChangeText, value }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <SymbolView
        name="magnifyingglass"
        size={16}
        tintColor={colors.secondaryLabel as string}
      />
      <TextInput
        accessibilityLabel="Search conversations"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        selectionColor={colors.accent}
        style={styles.input}
        value={value}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Clear conversation search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}>
          <SymbolView
            name="xmark.circle.fill"
            size={16}
            tintColor={colors.secondaryLabel as string}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: -10,
    width: 44,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 8,
    flexDirection: 'row',
    height: 44,
    marginHorizontal: 12,
    marginTop: 8,
    paddingLeft: 12,
  },
  input: {
    color: colors.label,
    flex: 1,
    fontSize: 16,
    height: 44,
    letterSpacing: 0,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
});
