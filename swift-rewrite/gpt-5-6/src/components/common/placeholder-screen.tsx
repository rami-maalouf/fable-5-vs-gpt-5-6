// ports: twilight/twilightapp.swift

import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function PlaceholderScreen({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <View
      accessibilityLabel={`${title} screen`}
      style={[styles.container, { backgroundColor: theme.backgroundGradient[0] }]}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
