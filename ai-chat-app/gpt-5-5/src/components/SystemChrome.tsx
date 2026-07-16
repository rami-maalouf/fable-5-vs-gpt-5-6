import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import type { ColorValue } from 'react-native';

type SystemChromeProps = {
  backgroundColor: ColorValue;
};

export function SystemChrome({ backgroundColor }: SystemChromeProps) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return <StatusBar animated style="auto" />;
}
