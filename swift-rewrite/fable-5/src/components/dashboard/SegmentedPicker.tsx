// ios-style segmented control matching the original's .pickerStyle(.segmented)
// look on the dark dashboard (IMG_4796)
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SegmentedPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  const isLight = theme.name === 'sunset';
  return (
    <View style={[styles.track, { backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(118, 118, 128, 0.24)' }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: isLight ? '#ffffff' : 'rgba(99, 99, 102, 0.9)',
              },
              selected && styles.segmentSelectedShadow,
            ]}>
            <Text
              style={[
                styles.label,
                { color: theme.textPrimary },
                selected && styles.labelSelected,
              ]}
              numberOfLines={1}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    flex: 1,
  },
  segment: {
    flex: 1,
    borderRadius: 7,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelectedShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  label: { fontSize: 13, fontWeight: '500' },
  labelSelected: { fontWeight: '600' },
});
