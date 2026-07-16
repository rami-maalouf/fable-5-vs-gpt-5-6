export const WIND_DOWN_TITLE = 'Wind Down Time 🌙';

export const WIND_DOWN_MESSAGES = [
  'Sleep is not the end of today. It is the beginning of tomorrow.',
  'Your future self called. They would love a calm, well-rested morning.',
  'Dim the lights, soften the pace, and let the day loosen its grip.',
  'A steady bedtime is one of the kindest gifts you can give tomorrow.',
  'The day can wait here. Your pillow has the next shift covered.',
  'Trade one more scroll for a little more rest. Your brain will thank you.',
  'Start landing gently: lower the lights, breathe slowly, and get cozy.',
  'Tonight does not need a perfect routine. One quiet step is enough.',
  'Give your mind a softer runway into sleep. It has carried plenty today.',
  'The moon is clocking in, which means you can start clocking out.',
] as const;

export function selectWindDownMessage(random: () => number = Math.random): string {
  const index = Math.min(
    WIND_DOWN_MESSAGES.length - 1,
    Math.max(0, Math.floor(random() * WIND_DOWN_MESSAGES.length)),
  );
  return WIND_DOWN_MESSAGES[index];
}
