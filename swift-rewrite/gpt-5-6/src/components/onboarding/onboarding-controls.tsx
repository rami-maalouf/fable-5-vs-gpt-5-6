// ports: twilight/views/sleeponboardingview.swift

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import { useTheme } from '@/theme/ThemeProvider';

export function OnboardingToolbar({
  onBack,
  step,
}: {
  onBack?: () => void;
  step: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.toolbar}>
      {onBack ? (
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <PlatformSymbol androidName="chevron-back" color={theme.accent} size={22} symbol="chevron.left" />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <View style={styles.progress}>
        <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>Step {step} of 4</Text>
        <View accessibilityLabel={`Onboarding step ${step} of 4`} style={styles.dots}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.dot,
                { backgroundColor: item <= step ? theme.accent : theme.actionSecondary },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.backButton} />
    </View>
  );
}

export function OnboardingFooter({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <LinearGradient
      colors={['transparent', theme.backgroundGradient[1]]}
      locations={[0, 0.34]}
      style={styles.footer}
    >
      {children}
    </LinearGradient>
  );
}

export function OnboardingPrimaryButton({
  busy = false,
  disabled = false,
  onPress,
  title,
}: {
  busy?: boolean;
  disabled?: boolean;
  onPress(): void;
  title: string;
}) {
  const { theme } = useTheme();
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  const isDisabled = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: theme.actionPrimary, opacity: isDisabled ? 0.5 : pressed ? 0.78 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryTitle}>{title}</Text>}
      {!busy ? <PlatformSymbol androidName="arrow-forward" color="#ffffff" size={18} symbol="arrow.right" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  dot: { borderRadius: 3, height: 5, width: 22 },
  dots: { flexDirection: 'row', gap: 6 },
  footer: { paddingBottom: 10, paddingHorizontal: 18, paddingTop: 34 },
  primaryButton: { alignItems: 'center', borderRadius: 30, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 56 },
  primaryTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  progress: { alignItems: 'center', flex: 1, gap: 7 },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  toolbar: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingHorizontal: 8 },
});
