import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/common/glass-card';
import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

export default function LogEditorRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { theme } = useTheme();
  return (
    <ScreenBackground>
      <Stack.Screen options={{ gestureEnabled: true, headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {sessionId ? 'Edit Sleep' : 'Log Sleep'}
          </Text>
          <View style={styles.toolbarSpacer} />
        </View>
        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Sleep window</Text>
          <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>The full editor is connected in task 13.</Text>
        </GlassCard>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  cancel: { fontSize: 16, fontWeight: '700' },
  card: { marginTop: 28 },
  cardCopy: { fontSize: 15, marginTop: 8 },
  cardTitle: { fontSize: 21, fontWeight: '800' },
  safeArea: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  toolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  toolbarSpacer: { width: 52 },
});
