export type ShortSleepJoke = (duration: string) => string;

export const SHORT_SLEEP_JOKES: readonly ShortSleepJoke[] = [
  (duration) => `Did you really have a ${duration} sleep?`,
  (duration) => `${duration}? That was more of a dramatic pause.`,
  (duration) => `A ${duration} sleep is just blinking with ambition.`,
  (duration) => `Only ${duration}? Your pillow barely learned your name.`,
  (duration) => `${duration} logged. The moon is filing an appeal.`,
  (duration) => `That ${duration} sleep was a trailer, not the feature.`,
  (duration) => `${duration}? Even the stars stayed awake for that one.`,
];

export function formatShortSleepDuration(durationSeconds: number): string {
  const seconds = Math.max(0, Math.floor(durationSeconds));
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

export function getShortSleepJoke(durationSeconds: number, seed: string): string {
  const index =
    [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) %
    SHORT_SLEEP_JOKES.length;
  return SHORT_SLEEP_JOKES[index](formatShortSleepDuration(durationSeconds));
}
