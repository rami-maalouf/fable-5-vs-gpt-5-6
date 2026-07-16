import { formatShortSleepTime, pickSubFiveMinuteSleepJoke, subFiveMinuteSleepJokes } from './jokes';

describe('sub five minute sleep jokes', () => {
  it('formats seconds and minute durations with Swift pluralization', () => {
    expect(formatShortSleepTime(1)).toBe('1 second');
    expect(formatShortSleepTime(59)).toBe('59 seconds');
    expect(formatShortSleepTime(60)).toBe('1 minute');
    expect(formatShortSleepTime(299)).toBe('4 minutes');
  });

  it('keeps the seven source joke variants without emoji glyphs', () => {
    expect(subFiveMinuteSleepJokes(120)).toEqual([
      'Did you really have a 2 minutes sleep?',
      'Is 2 minutes all the sleep you got?',
      'Wait, was that really a 2 minutes sleep?',
      "Only 2 minutes? That wouldn't even be considered a nap",
      'Even a power nap is longer than 2 minutes...',
      'Barely 2 minutes? Not even a cat nap!',
      'You call 2 minutes a sleep? I call it a blink',
    ]);
  });

  it('picks a joke through injectable randomness', () => {
    expect(pickSubFiveMinuteSleepJoke(120, () => 0.99)).toBe('You call 2 minutes a sleep? I call it a blink');
  });
});
