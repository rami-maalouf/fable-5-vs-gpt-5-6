// ports: Views/Onboarding/NotificationPermissionStepView.swift (step 3);
// finishing here writes the schedule + is_onboarded flag (step 4 "finish")
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInSlide } from '@/components/common/FadeInSlide';
import { Screen } from '@/components/common/Screen';
import { useSettings } from '@/state/settings-state';
import { useTheme } from '@/theme/ThemeProvider';

const FEATURES: { icon: SymbolViewProps['name']; title: string; subtitle: string }[] = [
  {
    icon: 'bell.fill',
    title: 'Bedtime nudges',
    subtitle: 'Meaningful reminders to maximize your sleep quality.',
  },
  {
    icon: 'chart.bar.fill',
    title: 'Weekly insights',
    subtitle: 'Simple summaries of your sleep consistency.',
  },
  {
    icon: 'exclamationmark.triangle.fill',
    title: 'Only when needed',
    subtitle: "We won't spam you with notifications.",
  },
];

export default function NotificationsStep() {
  const theme = useTheme();
  const setSetting = useSettings((s) => s.setSetting);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((p) => setAuthorized(p.granted));
  }, []);

  const requestPermission = async () => {
    const result = await Notifications.requestPermissionsAsync();
    setAuthorized(result.granted);
  };

  const finish = () => {
    setSetting('isOnboarded', true);
    router.replace('/');
  };

  return (
    <Screen starCount={35}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInSlide delay={0} slideOffset={22}>
          <View style={[styles.previewCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewIcon, { backgroundColor: theme.actionPrimary }]}>
                <SymbolView name="moon.fill" size={13} tintColor="#ffffff" />
              </View>
              <Text style={[styles.previewApp, { color: theme.textSecondary }]}>
                SLEEP TRACKER
              </Text>
              <View style={styles.flexSpacer} />
              <Text style={[styles.previewNow, { color: theme.textSecondary }]}>Now</Text>
            </View>
            <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
              Time to wind down 🌙
            </Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>
              Remember, sleep is not the end of today, it&apos;s the beginning of tomorrow.
            </Text>
          </View>
        </FadeInSlide>

        <FadeInSlide delay={0.1} slideOffset={20}>
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Regain control of your sleep schedule
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Consistency is key to better rest. Enable notifications so we can intelligently
              nudge you towards good sleeping habits
            </Text>
          </View>
        </FadeInSlide>

        <FadeInSlide delay={0.22} slideOffset={24}>
          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={[styles.featureRow, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.featureIcon, { backgroundColor: `${theme.actionPrimary}26` }]}>
                  <SymbolView name={feature.icon} size={17} tintColor={theme.actionPrimary} />
                </View>
                <View style={styles.featureTexts}>
                  <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>
                    {feature.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInSlide>
      </ScrollView>

      <FadeInSlide delay={0.34} slideOffset={18} style={styles.actionArea}>
        {authorized ? (
          <Pressable
            testID="notifications-continue"
            onPress={finish}
            style={[styles.primaryButton, { backgroundColor: theme.success }]}>
            <SymbolView name="checkmark.circle.fill" size={17} tintColor="#000000" />
            <Text style={[styles.primaryLabel, styles.darkLabel]}>Notifications Enabled</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              testID="turn-on-notifications"
              onPress={requestPermission}
              style={[styles.primaryButton, { backgroundColor: theme.actionPrimary }]}>
              <Text style={styles.primaryLabel}>Turn on Notifications</Text>
            </Pressable>
            <Pressable testID="maybe-later" onPress={finish} hitSlop={8}>
              <Text style={[styles.maybeLater, { color: theme.textSecondary }]}>Maybe later</Text>
            </Pressable>
          </>
        )}
      </FadeInSlide>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 70, paddingBottom: 160, gap: 24 },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    gap: 12,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewApp: { fontSize: 12, fontWeight: '500' },
  previewNow: { fontSize: 12 },
  flexSpacer: { flex: 1 },
  previewTitle: { fontSize: 17, fontWeight: '600' },
  previewBody: { fontSize: 15 },
  headerBlock: { gap: 8, paddingTop: 10 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 17, textAlign: 'center' },
  features: { gap: 12 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 14,
    padding: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTexts: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 15, fontWeight: '600' },
  featureSubtitle: { fontSize: 13 },
  actionArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 30,
    paddingVertical: 16,
    alignSelf: 'stretch',
  },
  primaryLabel: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
  darkLabel: { color: '#000000' },
  maybeLater: { fontSize: 15 },
});
