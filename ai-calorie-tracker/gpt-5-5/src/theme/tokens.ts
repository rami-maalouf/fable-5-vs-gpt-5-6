import { Platform, type ColorSchemeName } from "react-native";

export type NourishTheme = {
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceSubtle: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    onAccent: string;
    accent: string;
    accentSoft: string;
    danger: string;
    shadow: string;
    track: string;
    protein: string;
    proteinSoft: string;
    carbs: string;
    carbsSoft: string;
    fat: string;
    fatSoft: string;
  };
};

export const nourishSpacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
} as const;

export const nourishRadii = {
  small: 12,
  medium: 18,
  large: 28,
  pill: 999,
} as const;

export const nourishTouchTargets = {
  minimum: 44,
  primary: 56,
} as const;

export const nourishLayout = {
  bottomTabInset: Platform.select({ ios: 50, android: 80 }) ?? 0,
  maxContentWidth: 800,
} as const;

const lightTheme: NourishTheme = {
  colors: {
    background: "#FFF8F2",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFDFB",
    surfaceSubtle: "#F7ECE4",
    border: "#E8D9CE",
    textPrimary: "#261A14",
    textSecondary: "#6E5F54",
    textTertiary: "#9A887A",
    onAccent: "#FFFFFF",
    accent: "#C8422D",
    accentSoft: "#FDE3D9",
    danger: "#B54838",
    shadow: "#3D2516",
    track: "#EADCD2",
    protein: "#C73967",
    proteinSoft: "#F8D8E3",
    carbs: "#C67B19",
    carbsSoft: "#F7E4C2",
    fat: "#5C5BE8",
    fatSoft: "#DEDEFF",
  },
};

const darkTheme: NourishTheme = {
  colors: {
    background: "#15100D",
    surface: "#211915",
    surfaceRaised: "#2B211C",
    surfaceSubtle: "#372B24",
    border: "#49392F",
    textPrimary: "#FFF7F0",
    textSecondary: "#D8C9BD",
    textTertiary: "#A99588",
    onAccent: "#261A14",
    accent: "#FF7B5F",
    accentSoft: "#4C261F",
    danger: "#FF9A84",
    shadow: "#000000",
    track: "#4A3A31",
    protein: "#FF6F9C",
    proteinSoft: "#4D2332",
    carbs: "#F3A536",
    carbsSoft: "#4A341B",
    fat: "#9492FF",
    fatSoft: "#2F2E54",
  },
};

export function getNourishTheme(colorScheme: ColorSchemeName): NourishTheme {
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
