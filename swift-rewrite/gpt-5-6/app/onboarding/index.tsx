// ports: twilight/views/onboarding/welcomestepview.swift

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInSlide } from '@/components/common/fade-in-slide';
import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  OnboardingFooter,
  OnboardingPrimaryButton,
} from '@/components/onboarding/onboarding-controls';
import { useTheme } from '@/theme/ThemeProvider';

const TRUST_PROMISES = [
  { androidIcon: 'card-outline' as const, color: '#4cd964', symbol: 'dollarsign', title: 'No subscription' },
  { androidIcon: 'mic-off' as const, color: '#af52de', symbol: 'mic.slash.fill', title: 'No recording' },
  { androidIcon: 'phone-portrait-outline' as const, color: '#5ac8fa', symbol: 'iphone.slash', title: '100% offline' },
  { androidIcon: 'heart' as const, color: '#ff5a5f', symbol: 'heart.fill', title: 'Made for rest' },
] as const;

export default function WelcomeOnboardingRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Welcome to Twilight" style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.spacer} />
          <FadeInSlide>
            <View style={styles.moon}>
              <GlowingMoonView size={100} />
            </View>
          </FadeInSlide>
          <FadeInSlide delay={180}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>A calmer way to track sleep</Text>
          </FadeInSlide>
          <FadeInSlide delay={300}>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Most sleep apps track everything. Twilight tracks only what you need and can control: your sleep and wake times. That&apos;s it.</Text>
          </FadeInSlide>
          <FadeInSlide delay={420}>
            <View style={styles.trustGrid}>
              {TRUST_PROMISES.map((promise) => (
                <View key={promise.title} style={[styles.trustCard, { backgroundColor: theme.cardBackground, borderColor: `${promise.color}38` }]}>
                  <View style={[styles.trustIcon, { backgroundColor: `${promise.color}24` }]}>
                    <PlatformSymbol androidName={promise.androidIcon} color={promise.color} size={17} symbol={promise.symbol} />
                  </View>
                  <Text style={[styles.trustTitle, { color: theme.textPrimary }]}>{promise.title}</Text>
                </View>
              ))}
            </View>
          </FadeInSlide>
          <View style={styles.spacer} />
        </View>
        <FadeInSlide delay={620}>
          <OnboardingFooter>
            <OnboardingPrimaryButton onPress={() => router.push('/onboarding/schedule')} title="Get Started" />
          </OnboardingFooter>
        </FadeInSlide>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 24, paddingHorizontal: 18 },
  moon: { alignItems: 'center' },
  safeArea: { flex: 1 },
  spacer: { flex: 1 },
  subtitle: { fontSize: 16, lineHeight: 23, paddingHorizontal: 8, textAlign: 'center' },
  title: { fontSize: 35, fontWeight: '800', lineHeight: 41, paddingHorizontal: 8, textAlign: 'center' },
  trustCard: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 58, paddingHorizontal: 12, width: '48.5%' },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trustIcon: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  trustTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
});
