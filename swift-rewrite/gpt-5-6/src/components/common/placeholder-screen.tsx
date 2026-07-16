// ports: twilight/twilightapp.swift

import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export function PlaceholderScreen({ title }: { title: string }) {
  const isDark = useColorScheme() !== 'light';

  return (
    <View
      accessibilityLabel={`${title} screen`}
      style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}
    >
      <Text accessibilityRole="header" style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
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
  darkContainer: {
    backgroundColor: 'black',
  },
  lightContainer: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  darkText: {
    color: 'white',
  },
  lightText: {
    color: 'black',
  },
});
