// floating primary scan action. pure presentation: the screen supplies the
// press handler and positions the button above the bottom safe area.
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';

type ScanButtonProps = {
  onPress: () => void;
};

export function ScanButton({ onPress }: ScanButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scan meal"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M9 6.5 L10.4 4 H13.6 L15 6.5"
          stroke={colors.onAccent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Rect
          x={3}
          y={6.5}
          width={18}
          height={13.5}
          rx={4}
          stroke={colors.onAccent}
          strokeWidth={2}
          fill="none"
        />
        <Circle
          cx={12}
          cy={13}
          r={3.6}
          stroke={colors.onAccent}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
      <Text style={[styles.label, { color: colors.onAccent }]}>Scan meal</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    minHeight: 56,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.pill,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    ...typeScale.bodyStrong,
    fontSize: 17,
  },
});
