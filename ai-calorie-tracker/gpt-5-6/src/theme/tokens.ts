import { useColorScheme } from "react-native";

export const nourishThemes = {
  light: {
    coral: "#b84a42",
    primary: "#b84a42",
    primaryPressed: "#a83a34",
    protein: "#ad315e",
    carbs: "#a96b17",
    fat: "#5141b5",
    overGoal: "#b94038",
    background: "#f7f3ed",
    surface: "#fffdf9",
    surfaceRaised: "#ffffff",
    text: "#211c1a",
    textMuted: "#756b66",
    border: "#e8ded6",
    track: "#ebe3dc",
    emptyIcon: "#d8c9bd",
    photoBackground: "#111111",
    photoScrim: "rgba(0, 0, 0, 0.18)",
    shadow: "#4c3327",
    onAccent: "#ffffff",
  },
  dark: {
    coral: "#ff857a",
    primary: "#bd493f",
    primaryPressed: "#a83a34",
    protein: "#f06b98",
    carbs: "#f5ad4f",
    fat: "#a89cff",
    overGoal: "#ff8c80",
    background: "#141110",
    surface: "#201c1a",
    surfaceRaised: "#292321",
    text: "#fff8f2",
    textMuted: "#b9ada6",
    border: "#3b322e",
    track: "#39312d",
    emptyIcon: "#574a44",
    photoBackground: "#080707",
    photoScrim: "rgba(0, 0, 0, 0.24)",
    shadow: "#000000",
    onAccent: "#ffffff",
  },
} as const;

export type NourishTheme = (typeof nourishThemes)[keyof typeof nourishThemes];

export function useNourishTheme() {
  return nourishThemes[useColorScheme() === "dark" ? "dark" : "light"];
}
