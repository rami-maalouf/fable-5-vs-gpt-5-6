import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

type SystemChromeProps = {
  backgroundColor: string;
};

export function SystemChrome({ backgroundColor }: SystemChromeProps) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return <StatusBar animated style="auto" />;
}
