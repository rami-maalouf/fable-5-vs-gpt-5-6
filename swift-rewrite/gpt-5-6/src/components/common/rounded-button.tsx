// ports: twilight/components/common/roundedbutton.swift

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface RoundedButtonProps {
  onPress: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
}

export function RoundedButton({ onPress, selected = false, style, title }: RoundedButtonProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={style}>
      <BlurView
        intensity={18}
        style={[
          styles.button,
          { backgroundColor: selected ? theme.actionSecondary : 'rgba(128,128,128,0.2)' },
        ]}
        tint={theme.colorScheme}
      >
        <Text style={[styles.title, { color: selected ? theme.textPrimary : theme.textSecondary }]}>
          {title}
        </Text>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
});
