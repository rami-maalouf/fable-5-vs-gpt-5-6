import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CardBackground, CircularTimePicker } from '@/components/common';
import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';
import { defaultSleepSettings } from '@/domain/models';
import { themes } from '@/theme';

export default function LogsScreen() {
  const theme = themes.twilight;
  const [pickerTimes, setPickerTimes] = useState({
    sleepMinutes: defaultSleepSettings.optimalSleepMinutes,
    wakeMinutes: defaultSleepSettings.optimalWakeMinutes,
  });

  return (
    <TwilightPlaceholderScreen
      eyebrow="history"
      title="Logs"
      body="valid sleep sessions, manual edits, and delete actions will land here.">
      {__DEV__ ? (
        <CardBackground theme={theme} style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>task 9</Text>
              <Text style={[styles.title, { color: theme.textPrimary }]}>circular time picker</Text>
            </View>
            <Text style={[styles.badge, { color: theme.accent }]}>drag knobs</Text>
          </View>
          <CircularTimePicker
            onChange={setPickerTimes}
            sleepMinutes={pickerTimes.sleepMinutes}
            wakeMinutes={pickerTimes.wakeMinutes}
            theme={theme}
          />
        </CardBackground>
      ) : null}
    </TwilightPlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  badge: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
});
