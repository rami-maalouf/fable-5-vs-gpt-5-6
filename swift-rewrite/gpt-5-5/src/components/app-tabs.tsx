import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { twilightTabsByRoute } from '@/navigation/twilight-tabs';
import { themes } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

import { rgba } from './common/color';

export default function AppTabs() {
  const theme = useSleepAppearanceTheme(themes.twilight);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: rgba(theme.accent, 0.14),
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textPrimary,
        tabBarItemStyle: {
          borderRadius: 34,
          marginHorizontal: 4,
          marginVertical: 8,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: rgba('#061522', 0.9),
          borderColor: rgba(theme.accent, 0.24),
          borderRadius: 42,
          borderTopWidth: 1,
          bottom: 10,
          height: 84,
          left: 24,
          paddingBottom: 10,
          paddingTop: 8,
          position: 'absolute',
          right: 24,
        },
      }}>
      <Tabs.Screen
        name={twilightTabsByRoute.index.route}
        options={{
          title: twilightTabsByRoute.index.label,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: twilightTabsByRoute.index.sfSymbol,
                android: twilightTabsByRoute.index.materialSymbol,
                web: twilightTabsByRoute.index.materialSymbol,
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name={twilightTabsByRoute.metrics.route}
        options={{
          title: twilightTabsByRoute.metrics.label,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: twilightTabsByRoute.metrics.sfSymbol,
                android: twilightTabsByRoute.metrics.materialSymbol,
                web: twilightTabsByRoute.metrics.materialSymbol,
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name={twilightTabsByRoute.logs.route}
        options={{
          title: twilightTabsByRoute.logs.label,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: twilightTabsByRoute.logs.sfSymbol,
                android: twilightTabsByRoute.logs.materialSymbol,
                web: twilightTabsByRoute.logs.materialSymbol,
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name={twilightTabsByRoute.settings.route}
        options={{
          title: twilightTabsByRoute.settings.label,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: twilightTabsByRoute.settings.sfSymbol,
                android: twilightTabsByRoute.settings.materialSymbol,
                web: twilightTabsByRoute.settings.materialSymbol,
              }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
