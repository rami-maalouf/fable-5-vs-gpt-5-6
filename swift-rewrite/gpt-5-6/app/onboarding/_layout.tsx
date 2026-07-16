import { Stack } from 'expo-router/stack';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }} />;
}
