// ports: Components/Common/RoundedButton.swift
// pill button: subheadline medium, padding 12/8, radius 16, ultraThinMaterial,
// white 0.15 stroke, light haptic on tap
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function RoundedButton({
  text,
  onPress,
  icon,
  textColor,
  fontSize = 15,
  style,
}: {
  text: string;
  onPress: () => void;
  icon?: SymbolViewProps['name'];
  textColor?: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const tint = theme.name === 'sunset' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark';
  const color = textColor ?? '#8e8e93';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={style}>
      <View style={styles.clip}>
        <BlurView intensity={100} tint={tint} style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          {icon ? <SymbolView name={icon} size={fontSize} weight="medium" tintColor={color} /> : null}
          {text.length > 0 && (
            <Text style={[styles.text, { color, fontSize }]}>{text}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { fontWeight: '500' },
});
