import { Stack } from 'expo-router';

import { useNourishTheme } from '@/theme/tokens';

export default function AppTabs() {
  const theme = useNourishTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
