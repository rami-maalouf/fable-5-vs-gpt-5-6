// ports: twilight/twilightapp.swift, twilight/views/sleepdashboardview.swift

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardBackground } from '@/components/common/card-background';
import { GlassCard } from '@/components/common/glass-card';
import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { RoundedButton } from '@/components/common/rounded-button';
import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

export function PlaceholderScreen({ title }: { title: string }) {
  const { palette, setPalette, theme } = useTheme();
  const isHome = title === 'Home';
  const isSettings = title === 'Settings';

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel={`${title} screen`} edges={['top']} style={styles.safeArea}>
        <View style={styles.container}>
          {isHome ? <GlowingMoonView /> : null}
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Twilight sleep companion
            </Text>
          </View>
          {isHome ? (
            <CardBackground active style={styles.largeCard}>
              <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>TONIGHT</Text>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Ready when you are</Text>
              <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>
                Your sleep ritual starts here.
              </Text>
            </CardBackground>
          ) : (
            <GlassCard style={styles.card}>
              <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>
                COMING INTO FOCUS
              </Text>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {title} experience
              </Text>
              <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>
                The shared visual system is ready.
              </Text>
              {isSettings ? (
                <View style={styles.paletteRow}>
                  <RoundedButton
                    onPress={() => void setPalette('twilight')}
                    selected={palette === 'twilight'}
                    style={styles.paletteButton}
                    title="Twilight"
                  />
                  <RoundedButton
                    onPress={() => void setPalette('amethyst')}
                    selected={palette === 'amethyst'}
                    style={styles.paletteButton}
                    title="Amethyst"
                  />
                </View>
              ) : null}
            </GlassCard>
          )}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
  },
  cardCopy: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 72,
  },
  heading: {
    alignItems: 'center',
    marginBottom: 18,
  },
  largeCard: {
    marginHorizontal: 16,
    minHeight: 176,
  },
  paletteButton: {
    flex: 1,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  safeArea: {
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
});
