// ports: twilight/views/blockedprofileview.swift

import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/common/glass-card';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

const screenOptions = { gestureEnabled: true, headerShown: false } as const;

const SLEEP_TIPS = [
  ['sun.max.fill', 'sunny', 'Anchor your wake time', 'Wake at roughly the same time each day, including weekends.'],
  ['moon.stars.fill', 'moon', 'Dim the evening', 'Lower bright lights and screen intensity during the hour before bed.'],
  ['mug.fill', 'cafe', 'Time your caffeine', 'Give caffeine a wide runway before bedtime, especially if you are sensitive to it.'],
  ['bed.double.fill', 'bed', 'Make the room restful', 'Keep your bedroom cool, quiet, and as dark as you comfortably can.'],
  ['figure.walk', 'walk', 'Move during the day', 'Regular daytime movement supports sleep pressure and steadier nights.'],
  ['brain.head.profile', 'bulb', 'Unload your mind', 'Write tomorrow’s tasks down so they do not have to stay active in your head.'],
  ['clock.fill', 'time', 'Let sleep arrive', 'If you are wide awake, do something calm in dim light and return when sleepy.'],
] as const;

export default function SleepTipsRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/settings');
  };

  return (
    <ScreenBackground>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.toolbar}>
          <Pressable accessibilityLabel="Back to settings" accessibilityRole="button" onPress={close} style={styles.backButton}>
            <PlatformSymbol androidName="chevron-back" color={theme.accent} size={22} symbol="chevron.left" />
          </Pressable>
          <View style={styles.flex}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Sleep hygiene</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Gentle habits, not rigid rules.</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {SLEEP_TIPS.map(([icon, androidIcon, title, detail], index) => (
            <GlassCard key={title} style={styles.cardFlush}>
              <View style={styles.tipRow}>
                <View style={[styles.number, { backgroundColor: `${theme.accent}22` }]}>
                  <PlatformSymbol androidName={androidIcon} color={theme.accent} size={21} symbol={icon} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>{index + 1}. {title}</Text>
                  <Text style={[styles.tipDetail, { color: theme.textSecondary }]}>{detail}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
          <Text style={[styles.footer, { color: theme.textSecondary }]}>Experiment gently and keep what makes your nights feel better.</Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 36 },
  cardFlush: { marginHorizontal: 0 },
  content: { gap: 12, paddingBottom: 38, paddingHorizontal: 18 },
  flex: { flex: 1 },
  footer: { fontSize: 13, lineHeight: 19, paddingHorizontal: 18, paddingTop: 6, textAlign: 'center' },
  number: { alignItems: 'center', borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 14, marginTop: 3 },
  tipDetail: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  tipRow: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  tipTitle: { fontSize: 16, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800' },
  toolbar: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingBottom: 18, paddingHorizontal: 13, paddingTop: 8 },
});
