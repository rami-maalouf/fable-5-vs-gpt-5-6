import { View } from 'react-native';

import { SleepToggleCard } from '@/components/dashboard/SleepToggleCard';
import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TwilightPlaceholderScreen
        eyebrow="twilight"
        title="Dashboard"
        body="sleep session controls, last-night status, and the dashboard charts will land here.">
        <SleepToggleCard />
      </TwilightPlaceholderScreen>
    </View>
  );
}
