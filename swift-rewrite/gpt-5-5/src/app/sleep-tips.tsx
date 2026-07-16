import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { rgba } from '@/components/common/color';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { AppTheme } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

const sleepTips = [
  {
    title: 'keep a steady anchor',
    body: 'Pick one wake time and let bedtime move around it. Consistency gives the body a clean signal.',
  },
  {
    title: 'dim the last hour',
    body: 'Reduce bright light, heavy meals, and work conversations before bed so the room can feel like night.',
  },
  {
    title: 'make the phone boring',
    body: 'Charge it away from the pillow. If you need audio, start it before you get into bed.',
  },
  {
    title: 'protect the bed',
    body: 'Use the bed for sleep and rest. If you feel wired, reset somewhere dim and quiet for a few minutes.',
  },
  {
    title: 'start tomorrow gently',
    body: 'Lay out one small morning cue: water, clothes, or a first task. Lower friction before you need willpower.',
  },
];

function Header({ theme }: { theme: AppTheme }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="go back to settings"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: rgba(theme.textPrimary, 0.08), borderColor: rgba(theme.textPrimary, 0.14) },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>‹ Settings</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>wind-down guide</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Hygiene</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Simple cues for the hour before bed. These are intentionally practical and low-friction.
      </Text>
    </View>
  );
}

export default function SleepTipsScreen() {
  const theme = useSleepAppearanceTheme();

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header theme={theme} />
        <CardBackground theme={theme} style={styles.card}>
          <View style={styles.tipList}>
            {sleepTips.map((tip, index) => (
              <View
                key={tip.title}
                style={[
                  styles.tipRow,
                  { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) },
                ]}>
                <View style={[styles.tipNumber, { backgroundColor: rgba(theme.actionPrimary, 0.18) }]}>
                  <Text style={[styles.tipNumberText, { color: theme.textPrimary }]}>{index + 1}</Text>
                </View>
                <View style={styles.tipCopy}>
                  <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>{tip.title}</Text>
                  <Text style={[styles.tipBody, { color: theme.textSecondary }]}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </CardBackground>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    paddingTop: Spacing.four,
    width: '100%',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: Spacing.four,
    textTransform: 'uppercase',
  },
  header: {
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  tipBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  tipCopy: {
    flex: 1,
  },
  tipList: {
    gap: Spacing.two,
  },
  tipNumber: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '900',
  },
  tipRow: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
    marginTop: Spacing.one,
  },
});
