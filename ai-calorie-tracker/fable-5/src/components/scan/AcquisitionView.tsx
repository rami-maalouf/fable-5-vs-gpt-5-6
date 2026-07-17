// acquisition state of the scan flow: pick a source for the meal photo.
// pure presentation - the screen owns the machine and supplies callbacks.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { ColorTokens } from '@/theme/tokens';

type AcquisitionViewProps = {
  onChooseCamera: () => void;
  onChooseLibrary: () => void;
  onClose: () => void;
  // set after a preparation failure so the user knows why they are back here
  notice?: string | null;
};

function CameraGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M9 6.5 L10.4 4 H13.6 L15 6.5"
        stroke={color}
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
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={12} cy={13} r={3.6} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function LibraryGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Rect
        x={3}
        y={4}
        width={18}
        height={16}
        rx={4}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={9} cy={9.5} r={1.6} fill={color} />
      <Path
        d="M4 17.5 L9.5 12.5 L13 15.5 L16 13 L20 16.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

type OptionCardProps = {
  title: string;
  caption: string;
  glyph: 'camera' | 'library';
  colors: ColorTokens;
  onPress: () => void;
};

function OptionCard({ title, caption, glyph, colors, onPress }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={caption}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.optionGlyph, { backgroundColor: colors.surfaceMuted }]}>
        {glyph === 'camera' ? (
          <CameraGlyph color={colors.accent} />
        ) : (
          <LibraryGlyph color={colors.accent} />
        )}
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.optionCaption, { color: colors.textSecondary }]}>
          {caption}
        </Text>
      </View>
    </Pressable>
  );
}

export function AcquisitionView({
  onChooseCamera,
  onChooseLibrary,
  onClose,
  notice,
}: AcquisitionViewProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close scan"
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [
          styles.close,
          {
            backgroundColor: colors.surfaceMuted,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M6 6 L18 18 M18 6 L6 18"
            stroke={colors.textPrimary}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>

      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          Scan a meal
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Snap your plate or pick a photo. Nourish estimates the calories and
          macros for you.
        </Text>
      </View>

      <View style={styles.options}>
        <OptionCard
          title="Take photo"
          caption="Point the camera at your plate"
          glyph="camera"
          colors={colors}
          onPress={onChooseCamera}
        />
        <OptionCard
          title="Choose from library"
          caption="Pick an existing photo"
          glyph="library"
          colors={colors}
          onPress={onChooseLibrary}
        />
        {notice ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.hint, { color: colors.over }]}
          >
            {notice}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: spacing.xxxl,
  },
  title: {
    ...typeScale.largeTitle,
  },
  subtitle: {
    ...typeScale.body,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  options: {
    marginTop: spacing.xxxl,
    gap: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 88,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionGlyph: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...typeScale.heading,
  },
  optionCaption: {
    ...typeScale.label,
  },
  hint: {
    ...typeScale.label,
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.xs,
    lineHeight: 18,
  },
});
