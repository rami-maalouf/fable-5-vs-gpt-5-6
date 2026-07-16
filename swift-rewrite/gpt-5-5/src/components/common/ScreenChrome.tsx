import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { themes, type AppTheme } from '@/theme';

import { StarfieldView } from './StarfieldView';

type ScreenChromeProps = PropsWithChildren<{
  theme?: AppTheme;
}>;

export function ScreenChrome({ children, theme = themes.twilight }: ScreenChromeProps) {
  return (
    <View style={styles.container}>
      <StarfieldView theme={theme} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
