// deterministic fixture generator for the golden parity suite.
// regenerate with: node tests/parity-harness/generate-fixtures.mjs
// then re-derive expected outputs from the verbatim swift analyzer:
//   TZ=America/Denver swift tests/parity-harness/*.swift tests/fixtures/<set>.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
mkdirSync(fixturesDir, { recursive: true });

// deterministic lcg so fixtures never change between runs
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const MIN = 60 * 1000;

// wall-clock (y, m, d, h, min) in a fixed-offset map for the zones we use.
// fixture dates are chosen away from dst transitions except where noted.
const OFFSETS = {
  'America/Denver': { std: -7, dst: -6, dstFrom: [3, 9], dstTo: [11, 2] }, // 2025: mar 9 - nov 2
  'Asia/Tokyo': { std: 9, dst: 9, dstFrom: [1, 1], dstTo: [1, 1] },
  'Europe/London': { std: 0, dst: 1, dstFrom: [3, 30], dstTo: [10, 26] },
};

function utcMs(tz, y, m, d, h, min) {
  const zone = OFFSETS[tz];
  const afterStart = m > zone.dstFrom[0] || (m === zone.dstFrom[0] && d >= zone.dstFrom[1]);
  const beforeEnd = m < zone.dstTo[0] || (m === zone.dstTo[0] && d < zone.dstTo[1]);
  const isDst = zone.dstFrom[0] !== zone.dstTo[0] && afterStart && beforeEnd;
  const offset = isDst ? zone.dst : zone.std;
  return Date.UTC(y, m - 1, d, h - offset, min);
}

let idCounter = 0;
function session(startMs, endMs, startTz, endTz = startTz, tag = 'Sleep Mode') {
  return { id: `fx-${idCounter++}`, tag, startTime: startMs, endTime: endMs, startTz, endTz };
}

function writeFixture(name, sessions, optimalSleepMinutes, optimalWakeMinutes) {
  const payload = { sessions, optimalSleepMinutes, optimalWakeMinutes };
  writeFileSync(join(fixturesDir, `${name}.json`), JSON.stringify(payload, null, 2) + '\n');
  console.log(`${name}: ${sessions.length} sessions`);
}

// 1. regular sleeper: 30 january nights, mild jitter, denver
{
  const rand = lcg(101);
  const tz = 'America/Denver';
  const sessions = [];
  for (let day = 1; day <= 30; day++) {
    const bedMin = 22 * 60 + 15 + Math.floor(rand() * 90); // 22:15-23:45
    const wakeMin = 6 * 60 + 30 + Math.floor(rand() * 90); // 06:30-08:00
    const start = utcMs(tz, 2025, 1, day, Math.trunc(bedMin / 60), bedMin % 60);
    const end = utcMs(tz, 2025, 1, day + 1, Math.trunc(wakeMin / 60), wakeMin % 60);
    sessions.push(session(start, end, tz));
  }
  writeFixture('regular-sleeper', sessions, 22 * 60 + 30, 6 * 60 + 30);
}

// 2. shift worker: post-midnight bedtimes, later targets
{
  const rand = lcg(202);
  const tz = 'America/Denver';
  const sessions = [];
  for (let day = 2; day <= 26; day++) {
    const bedMin = 1 * 60 + Math.floor(rand() * 150); // 01:00-03:30
    const wakeMin = 9 * 60 + Math.floor(rand() * 150); // 09:00-11:30
    const start = utcMs(tz, 2025, 2, day, Math.trunc(bedMin / 60), bedMin % 60);
    const end = utcMs(tz, 2025, 2, day, Math.trunc(wakeMin / 60), wakeMin % 60);
    sessions.push(session(start, end, tz));
  }
  // two pre-midnight exceptions
  sessions.push(session(utcMs(tz, 2025, 2, 26, 23, 40), utcMs(tz, 2025, 2, 27, 8, 5), tz));
  sessions.push(session(utcMs(tz, 2025, 2, 27, 22, 55), utcMs(tz, 2025, 2, 28, 9, 30), tz));
  writeFixture('shift-worker', sessions, 1 * 60 + 30, 9 * 60 + 30);
}

// 3. timezone traveler: denver -> tokyo -> london, including cross-tz nights
{
  const rand = lcg(303);
  const sessions = [];
  const legs = [
    { tz: 'America/Denver', from: 3, to: 9 },
    { tz: 'Asia/Tokyo', from: 11, to: 17 },
    { tz: 'Europe/London', from: 19, to: 24 },
  ];
  for (const leg of legs) {
    for (let day = leg.from; day <= leg.to; day++) {
      const bedMin = 22 * 60 + Math.floor(rand() * 120);
      const wakeMin = 6 * 60 + Math.floor(rand() * 120);
      const start = utcMs(leg.tz, 2025, 1, day, Math.trunc(bedMin / 60), bedMin % 60);
      const end = utcMs(leg.tz, 2025, 1, day + 1, Math.trunc(wakeMin / 60), wakeMin % 60);
      sessions.push(session(start, end, leg.tz));
    }
  }
  // red-eye flights: fall asleep in one zone, wake in the next
  sessions.push(
    session(
      utcMs('America/Denver', 2025, 1, 9, 22, 30),
      utcMs('Asia/Tokyo', 2025, 1, 11, 7, 10),
      'America/Denver',
      'Asia/Tokyo'
    )
  );
  sessions.push(
    session(
      utcMs('Asia/Tokyo', 2025, 1, 17, 23, 15),
      utcMs('Europe/London', 2025, 1, 18, 6, 45),
      'Asia/Tokyo',
      'Europe/London'
    )
  );
  writeFixture('timezone-traveler', sessions, 22 * 60 + 30, 6 * 60 + 45);
}

// 4. sub-5-minute noise + an active session, no targets (defaults path)
{
  const rand = lcg(404);
  const tz = 'America/Denver';
  const sessions = [];
  for (let day = 5; day <= 19; day++) {
    const bedMin = 23 * 60 + Math.floor(rand() * 45);
    const wakeMin = 7 * 60 + Math.floor(rand() * 45);
    const start = utcMs(tz, 2025, 1, day, Math.trunc(bedMin / 60), bedMin % 60);
    const end = utcMs(tz, 2025, 1, day + 1, Math.trunc(wakeMin / 60), wakeMin % 60);
    sessions.push(session(start, end, tz));
    // noise: accidental toggles under 5 minutes scattered through the day
    if (day % 2 === 1) {
      const noiseStart = utcMs(tz, 2025, 1, day, 14, 10);
      sessions.push(session(noiseStart, noiseStart + Math.floor(rand() * 299) * 1000, tz));
    }
  }
  // exactly 300s = valid boundary session as an extra nap (canonical loses to the night)
  const boundaryStart = utcMs(tz, 2025, 1, 12, 15, 0);
  sessions.push(session(boundaryStart, boundaryStart + 300 * 1000, tz));
  // active session (endTime null) must be ignored
  sessions.push(session(utcMs(tz, 2025, 1, 20, 23, 0), null, tz, null));
  writeFixture('sub-5-min-noise', sessions, null, null);
}

// 5. gaps and streak breaks + canonical-night contention
{
  const rand = lcg(505);
  const tz = 'America/Denver';
  const sessions = [];
  const daysWithSleep = [1, 2, 3, 6, 7, 10, 14, 15, 16, 17, 22, 25, 26, 30, 31, 34, 35, 36, 39, 40];
  for (const offset of daysWithSleep) {
    const base = new Date(Date.UTC(2025, 0, 1));
    base.setUTCDate(base.getUTCDate() + offset);
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const bedMin = 22 * 60 + 30 + Math.floor(rand() * 100);
    const wakeMin = 6 * 60 + Math.floor(rand() * 100);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    const start = utcMs(
      tz,
      prev.getUTCFullYear(),
      prev.getUTCMonth() + 1,
      prev.getUTCDate(),
      Math.trunc(bedMin / 60),
      bedMin % 60
    );
    const end = utcMs(tz, y, m, d, Math.trunc(wakeMin / 60), wakeMin % 60);
    sessions.push(session(start, end, tz));
    // same-day naps compete for the canonical night on some days
    if (offset % 5 === 0) {
      const napStart = utcMs(tz, y, m, d, 13, 30);
      sessions.push(session(napStart, napStart + (30 + Math.floor(rand() * 60)) * MIN, tz));
    }
  }
  writeFixture('gaps-streaks', sessions, 22 * 60 + 30, 6 * 60 + 30);
}
