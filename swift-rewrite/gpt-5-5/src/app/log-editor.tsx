import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { Spacing } from '@/constants/theme';
import { themes } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

export default function LogEditorPlaceholder() {
  const theme = useSleepAppearanceTheme(themes.twilight);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const mode = id ? 'edit' : 'new';

  return (
    <ScreenChrome theme={theme}>
      <View style={styles.content}>
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="button" onPress={() => router.dismiss()} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.textPrimary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: theme.textPrimary }]}>Log Sleep</Text>
          <View style={styles.toolbarSpacer} />
        </View>
        <CardBackground theme={theme} style={styles.card}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>task 13</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {mode === 'edit' ? 'Editor route ready' : 'New log route ready'}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            The full wake-day picker, circular picker, goal match, and save flow land in the next task.
          </Text>
        </CardBackground>
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cancelButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '700',
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  toolbarSpacer: {
    width: 70,
  },
  card: {
    marginHorizontal: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: Spacing.two,
  },
});
