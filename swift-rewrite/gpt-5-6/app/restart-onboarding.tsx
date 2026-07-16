// ports: twilight development onboarding reset

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '@/onboarding/OnboardingProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function RestartOnboardingRoute() {
  const router = useRouter();
  const { restartOnboarding } = useOnboarding();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/');
      return;
    }
    restartOnboarding()
      .then(() => router.replace('/onboarding'))
      .catch(() => setError('Twilight could not restart onboarding.'));
  }, [restartOnboarding, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundGradient[0] }]}>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.warning }]}>{error}</Text>
      ) : (
        <ActivityIndicator color={theme.accent} size="large" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  error: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
