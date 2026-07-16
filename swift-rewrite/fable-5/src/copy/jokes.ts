// ports: Utils/StrategyManager.swift - sub-5-minute session messages, verbatim
// pure ts

// swift: "\(Int(duration)) second" under a minute, else whole minutes; the "s"
// suffix is added unless the count is exactly 1
export function pluralizedTimeString(durationSeconds: number): string {
  let base: string;
  let singular: boolean;
  if (durationSeconds < 60) {
    const secs = Math.trunc(durationSeconds);
    base = `${secs} second`;
    singular = secs === 1;
  } else {
    const mins = Math.trunc(durationSeconds / 60);
    base = `${mins} minute`;
    singular = mins === 1;
  }
  return singular ? base : `${base}s`;
}

export const SHORT_SLEEP_JOKES = [
  // theme 1: skepticism
  (t: string) => `Did you really have a ${t} sleep? 🤨`,
  (t: string) => `Is ${t} all the sleep you got? 🤨`,
  (t: string) => `Wait, was that really a ${t} sleep? 🤨`,
  // theme 2: not even a nap
  (t: string) => `Only ${t}? That wouldn't even be considered a nap 🤧`,
  (t: string) => `Even a power nap is longer than ${t}... 🤧`,
  (t: string) => `Barely ${t}? Not even a cat nap! 🤧`,
  // classic
  (t: string) => `You call ${t} a sleep? I call it a blink ⚡️`,
] as const;

export function shortSleepJoke(durationSeconds: number, pick?: number): string {
  const t = pluralizedTimeString(durationSeconds);
  const index = pick ?? Math.floor(Math.random() * SHORT_SLEEP_JOKES.length);
  return SHORT_SLEEP_JOKES[index](t);
}
