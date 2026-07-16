// TEMPORARY picker harness (task 9) - the real logs list lands in task 12
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CircularTimePicker } from '@/components/common/CircularTimePicker';
import { Screen } from '@/components/common/Screen';
import { useTheme } from '@/theme/ThemeProvider';

export default function LogsScreen() {
  const theme = useTheme();
  const [sleepMinutes, setSleepMinutes] = useState(22 * 60 + 30);
  const [wakeMinutes, setWakeMinutes] = useState(7 * 60);

  const fmt = (m: number) =>
    `${String(Math.trunc(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  return (
    <Screen>
      <View style={styles.container}>
        <CircularTimePicker
          sleepMinutes={sleepMinutes}
          wakeMinutes={wakeMinutes}
          onChange={(s, w) => {
            setSleepMinutes(s);
            setWakeMinutes(w);
          }}
        />
        <Text style={{ color: theme.textSecondary }}>
          {fmt(sleepMinutes)} - {fmt(wakeMinutes)}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
});
