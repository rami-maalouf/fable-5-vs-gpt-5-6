// ports: twilight/components/common/sectiontitle.swift

import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: theme.textSecondary }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', paddingBottom: 10 },
});
