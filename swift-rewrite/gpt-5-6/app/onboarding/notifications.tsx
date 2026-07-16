// ports: twilight/views/onboarding/notificationpermissionstepview.swift

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInSlide } from '@/components/common/fade-in-slide';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  OnboardingFooter,
  OnboardingPrimaryButton,
  OnboardingToolbar,
} from '@/components/onboarding/onboarding-controls';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/services/notification-permissions';
import { useTheme } from '@/theme/ThemeProvider';

const FEATURES = [
  ['notifications', 'bell.fill', 'Bedtime nudges', 'Meaningful reminders that support your sleep schedule.'],
  ['stats-chart', 'chart.bar.fill', 'Weekly insights', 'Simple summaries of your sleep consistency.'],
  ['shield-checkmark', 'checkmark.shield.fill', 'Only when needed', 'Thoughtful timing, with no notification spam.'],
] as const;

export default function NotificationsOnboardingRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getNotificationPermission()
      .then((authorized) => {
        if (isCurrent) {
          setIsAuthorized(authorized);
        }
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, []);

  const requestPermission = async () => {
    setIsRequesting(true);
    setMessage(null);
    try {
      const authorized = await requestNotificationPermission();
      setIsAuthorized(authorized);
      if (!authorized) {
        setMessage('No worries. You can enable reminders later in Settings.');
      }
    } catch {
      setMessage('Twilight could not request notification access. You can try again later.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Notification permission" style={styles.safeArea}>
        <OnboardingToolbar onBack={() => router.back()} step={3} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInSlide>
            <View style={[styles.previewCard, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: theme.actionPrimary }]}>
                  <PlatformSymbol androidName="moon" color="#ffffff" size={16} symbol="moon.fill" />
                </View>
                <Text style={[styles.previewApp, { color: theme.textSecondary }]}>TWILIGHT</Text>
                <Text style={[styles.previewNow, { color: theme.textSecondary }]}>Now</Text>
              </View>
              <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>Time to wind down</Text>
              <Text style={[styles.previewCopy, { color: theme.textSecondary }]}>Sleep is not the end of today. It is the beginning of tomorrow.</Text>
            </View>
          </FadeInSlide>

          <FadeInSlide delay={100}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Regain control of your sleep schedule</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Consistency is key to better rest. Enable notifications for intelligent nudges toward steadier sleep.</Text>
          </FadeInSlide>

          <FadeInSlide delay={220}>
            <View style={styles.features}>
              {FEATURES.map(([androidIcon, symbol, title, detail]) => (
                <View key={title} style={[styles.featureRow, { backgroundColor: `${theme.cardBackground}bb` }]}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.cardBackground }]}>
                    <PlatformSymbol androidName={androidIcon} color={theme.accent} size={20} symbol={symbol} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{title}</Text>
                    <Text style={[styles.featureDetail, { color: theme.textSecondary }]}>{detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInSlide>
          {message ? <Text accessibilityRole="alert" style={[styles.message, { color: theme.textSecondary }]}>{message}</Text> : null}
        </ScrollView>
        <OnboardingFooter>
          <View style={styles.actions}>
            <OnboardingPrimaryButton
              busy={isRequesting}
              onPress={() => {
                if (isAuthorized) {
                  router.push('/onboarding/finish');
                  return;
                }
                void requestPermission();
              }}
              title={isAuthorized ? 'Notifications Enabled' : 'Turn on Notifications'}
            />
            {!isAuthorized ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding/finish')} style={styles.laterButton}>
                <Text style={[styles.laterText, { color: theme.textSecondary }]}>Maybe later</Text>
              </Pressable>
            ) : null}
          </View>
        </OnboardingFooter>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 11 },
  content: { gap: 16, paddingBottom: 8, paddingHorizontal: 18, paddingTop: 8 },
  featureDetail: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  featureIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  featureRow: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 14, minHeight: 70, padding: 12 },
  featureTitle: { fontSize: 15, fontWeight: '800' },
  features: { gap: 8 },
  flex: { flex: 1 },
  laterButton: { alignItems: 'center', minHeight: 34, justifyContent: 'center' },
  laterText: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  previewApp: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  previewCard: { borderColor: 'rgba(255,255,255,0.14)', borderRadius: 20, borderWidth: 1, padding: 16 },
  previewCopy: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  previewHeader: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  previewIcon: { alignItems: 'center', borderRadius: 7, height: 30, justifyContent: 'center', width: 30 },
  previewNow: { flex: 1, fontSize: 11, textAlign: 'right' },
  previewTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: 8, paddingHorizontal: 8, textAlign: 'center' },
  title: { fontSize: 25, fontWeight: '800', lineHeight: 31, paddingHorizontal: 8, textAlign: 'center' },
});
