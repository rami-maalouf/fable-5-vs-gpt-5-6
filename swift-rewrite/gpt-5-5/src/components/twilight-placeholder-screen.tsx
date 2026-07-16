import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, GlowingMoonView, ScreenChrome } from '@/components/common';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { themes } from '@/theme';

type TwilightPlaceholderScreenProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  body: string;
}>;

export function TwilightPlaceholderScreen({ body, children, eyebrow, title }: TwilightPlaceholderScreenProps) {
  const theme = themes.twilight;

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <CardBackground theme={theme} recipe="large" style={styles.card}>
          <View style={styles.heroCard}>
            <View style={styles.titleBlock}>
              <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
            </View>
            <GlowingMoonView size={64} />
          </View>
        </CardBackground>
        <CardBackground theme={theme} style={styles.card}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>shared chrome ready</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            this tab is rendering through the reusable gradient, starfield, glass card, and accent system.
          </Text>
        </CardBackground>
        {children}
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    flexGrow: 1,
    justifyContent: 'center',
    marginHorizontal: 'auto',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    width: '100%',
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  heroCard: {
    minHeight: 220,
    position: 'relative',
  },
  titleBlock: {
    gap: Spacing.two,
    maxWidth: 280,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.two,
    textTransform: 'capitalize',
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 280,
  },
});
