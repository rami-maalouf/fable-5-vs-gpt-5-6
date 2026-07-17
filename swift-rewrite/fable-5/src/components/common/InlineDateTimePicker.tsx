// platform-guarded compact date/time picker.
// ios: the native inline compact picker, matching the original's .compact style.
// android: display="compact" does not exist - a mounted picker opens its modal
// dialog immediately (all of them at boot, since native tabs mount eagerly),
// so render a pressable value chip that opens the system dialog on demand.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  value: Date;
  mode: 'date' | 'time';
  themeVariant: 'light' | 'dark';
  accentColor?: string;
  onValueChange: (date: Date) => void;
  style?: StyleProp<ViewStyle>;
}

function label(value: Date, mode: 'date' | 'time'): string {
  if (mode === 'time') {
    return value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InlineDateTimePicker({
  value,
  mode,
  themeVariant,
  accentColor,
  onValueChange,
  style,
}: Props) {
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="compact"
        themeVariant={themeVariant}
        accentColor={accentColor}
        onValueChange={(_, date) => {
          if (date) onValueChange(date);
        }}
        style={style}
      />
    );
  }
  const chipBg = themeVariant === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  const chipText = themeVariant === 'light' ? '#1c1c1e' : '#ffffff';
  return (
    <Pressable
      style={[styles.chip, { backgroundColor: chipBg }, style]}
      onPress={() =>
        DateTimePickerAndroid.open({
          value,
          mode,
          onValueChange: (_, date) => {
            if (date) onValueChange(date);
          },
        })
      }
    >
      <Text style={[styles.chipLabel, { color: chipText }]}>{label(value, mode)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
