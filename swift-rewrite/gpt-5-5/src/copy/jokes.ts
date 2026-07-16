const subFiveMinuteTemplates = [
  'Did you really have a {time} sleep?',
  'Is {time} all the sleep you got?',
  'Wait, was that really a {time} sleep?',
  "Only {time}? That wouldn't even be considered a nap",
  'Even a power nap is longer than {time}...',
  'Barely {time}? Not even a cat nap!',
  'You call {time} a sleep? I call it a blink',
] as const;

function pluralize(value: number, unit: 'second' | 'minute') {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

export function formatShortSleepTime(durationSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));

  if (safeSeconds < 60) {
    return pluralize(safeSeconds, 'second');
  }

  return pluralize(Math.floor(safeSeconds / 60), 'minute');
}

export function subFiveMinuteSleepJokes(durationSeconds: number) {
  const time = formatShortSleepTime(durationSeconds);

  return subFiveMinuteTemplates.map((template) => template.replace('{time}', time));
}

export function pickSubFiveMinuteSleepJoke(durationSeconds: number, random = Math.random) {
  const jokes = subFiveMinuteSleepJokes(durationSeconds);
  const index = Math.min(jokes.length - 1, Math.floor(random() * jokes.length));

  return jokes[index];
}
