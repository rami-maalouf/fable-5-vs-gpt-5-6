import { useColorScheme } from 'react-native';

const shared = {
  coral: '#ef695b',
  coralPressed: '#d9574b',
  protein: '#c74772',
  carbs: '#dc9634',
  fat: '#675bc7',
  overGoal: '#c5473d',
} as const;

export const nourishThemes = {
  light: {
    ...shared,
    background: '#f7f3ed',
    surface: '#fffdf9',
    surfaceRaised: '#ffffff',
    text: '#211c1a',
    textMuted: '#756b66',
    border: '#e8ded6',
    track: '#ebe3dc',
    emptyIcon: '#d8c9bd',
    shadow: '#4c3327',
    onAccent: '#ffffff',
  },
  dark: {
    ...shared,
    background: '#141110',
    surface: '#201c1a',
    surfaceRaised: '#292321',
    text: '#fff8f2',
    textMuted: '#b9ada6',
    border: '#3b322e',
    track: '#39312d',
    emptyIcon: '#574a44',
    shadow: '#000000',
    onAccent: '#ffffff',
  },
} as const;

export type NourishTheme = (typeof nourishThemes)[keyof typeof nourishThemes];

export function useNourishTheme() {
  return nourishThemes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
