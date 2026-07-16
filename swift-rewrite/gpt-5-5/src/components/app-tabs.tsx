import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { twilightTabsByRoute } from '@/navigation/twilight-tabs';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
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
