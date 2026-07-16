// ports: twilight/twilightapp.swift

import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { TAB_ROUTES } from '@/navigation/tabs';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <NativeTabs tintColor={theme.accent}>
      {TAB_ROUTES.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
