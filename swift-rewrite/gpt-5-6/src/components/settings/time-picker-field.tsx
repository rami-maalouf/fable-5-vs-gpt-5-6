import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlatformSymbol } from '@/components/common/platform-symbol';
import { dateFromMinutesSinceMidnight } from '@/components/settings/settings-model';
import { useTheme } from '@/theme/ThemeProvider';

interface TimePickerFieldProps {
  androidIcon: 'moon' | 'sunny';
  color: string;
  icon: string;
  label: string;
  minutes: number;
  onChange(date: Date): void;
  platform?: typeof Platform.OS;
}

export function TimePickerField({
  androidIcon,
  color,
  icon,
  label,
  minutes,
  onChange,
  platform = Platform.OS,
}: TimePickerFieldProps) {
  const { theme } = useTheme();
  const [isAndroidPickerVisible, setIsAndroidPickerVisible] = useState(false);
  const value = dateFromMinutesSinceMidnight(minutes);
  const testID = `settings-${label.toLowerCase().replaceAll(' ', '-')}`;

  if (platform !== 'android') {
    return (
      <View style={styles.timeField}>
        <TimeLabel androidIcon={androidIcon} color={color} icon={icon} label={label} />
        <DateTimePicker
          accentColor={color}
          display="compact"
          mode="time"
          onValueChange={(_event, date) => onChange(date)}
          testID={testID}
          themeVariant={theme.colorScheme}
          value={value}
        />
      </View>
    );
  }

  const formattedValue = value.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={styles.timeField}>
      <TimeLabel androidIcon={androidIcon} color={color} icon={icon} label={label} />
      <Pressable
        accessibilityLabel={`${label}, ${formattedValue}`}
        accessibilityRole="button"
        onPress={() => setIsAndroidPickerVisible(true)}
        style={({ pressed }) => [
          styles.androidValue,
          { backgroundColor: theme.actionSecondary },
          pressed && styles.pressed,
        ]}
        testID={testID}
      >
        <Text style={[styles.androidValueText, { color: theme.textPrimary }]}>{formattedValue}</Text>
      </Pressable>
      {isAndroidPickerVisible ? (
        <DateTimePicker
          accentColor={color}
          mode="time"
          onDismiss={() => setIsAndroidPickerVisible(false)}
          onValueChange={(_event, date) => {
            setIsAndroidPickerVisible(false);
            onChange(date);
          }}
          presentation="dialog"
          testID={`${testID}-picker`}
          value={value}
        />
      ) : null}
    </View>
  );
}

function TimeLabel({
  androidIcon,
  color,
  icon,
  label,
}: Pick<TimePickerFieldProps, 'androidIcon' | 'color' | 'icon' | 'label'>) {
  return (
    <View style={styles.timeLabelRow}>
      <PlatformSymbol androidName={androidIcon} color={color} size={16} symbol={icon} />
      <Text style={[styles.timeLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  androidValue: {
    borderRadius: 12,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  androidValueText: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.68 },
  timeField: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 17, fontWeight: '800' },
  timeLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 5 },
});
