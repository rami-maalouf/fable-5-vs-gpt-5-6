// ports behavior of: Components/Common/OnboardingCircularTimePicker.swift (drag math)
import {
  angleDifference,
  angleFromMinutes,
  durationFromAngles,
  grabTarget,
  minutesFromAngle,
  pointerAngle,
  sleepQualityMessage,
  snapAngle,
} from '../circular-picker';

describe('angle <-> minutes mapping (0 deg = midnight at 12 o clock)', () => {
  test('midnight is 0 degrees, noon is 180', () => {
    expect(angleFromMinutes(0)).toBe(0);
    expect(angleFromMinutes(12 * 60)).toBe(180);
  });

  test('22:30 maps to 337.5 degrees and back', () => {
    expect(angleFromMinutes(22 * 60 + 30)).toBe(337.5);
    expect(minutesFromAngle(337.5)).toBe(22 * 60 + 30);
  });

  test('round-trip matches swift Int() truncation, including its lossy values', () => {
    // swift's `Int((angle / 360) * (24 * 60))` truncates, and for some angles
    // ieee754 lands just below the integer (e.g. 1:55 -> 114.99.. -> 1:54).
    // the port reproduces that exact behavior: never off by more than one
    // minute downward, and the known quirk values match.
    for (let m = 0; m < 24 * 60; m += 5) {
      const roundTripped = minutesFromAngle(snapAngle(angleFromMinutes(m)));
      expect([m, m - 1]).toContain(roundTripped);
    }
    expect(minutesFromAngle(snapAngle(angleFromMinutes(115)))).toBe(114);
    expect(minutesFromAngle(snapAngle(angleFromMinutes(85)))).toBe(85);
  });
});

describe('pointerAngle (atan2 + 90 wrap)', () => {
  test('straight up is 0 degrees', () => {
    expect(pointerAngle(0, -1)).toBe(0);
  });
  test('right is 90, down is 180, left is 270', () => {
    expect(pointerAngle(1, 0)).toBe(90);
    expect(pointerAngle(0, 1)).toBe(180);
    expect(pointerAngle(-1, 0)).toBe(270);
  });
});

describe('angleDifference (shortest signed path)', () => {
  test('wraps across 0/360', () => {
    expect(angleDifference(350, 10)).toBe(-20);
    expect(angleDifference(10, 350)).toBe(20);
    expect(angleDifference(90, 45)).toBe(45);
  });
});

describe('snapAngle (1.25 deg = 5 minutes)', () => {
  test('snaps to the nearest 1.25 degrees', () => {
    expect(snapAngle(100.4)).toBe(100);
    expect(snapAngle(100.7)).toBe(101.25);
  });
});

describe('grabTarget (35 degree threshold, nearest knob wins)', () => {
  test('grabs sleep when closest and inside threshold', () => {
    expect(grabTarget(340, 337.5, 105)).toBe('sleep');
  });
  test('grabs wake when closest and inside threshold', () => {
    expect(grabTarget(100, 337.5, 105)).toBe('wake');
  });
  test('returns null outside the threshold', () => {
    expect(grabTarget(200, 337.5, 105)).toBeNull();
  });
  test('nearest knob wins when both are inside the threshold', () => {
    // pointer at 10 deg: sleep at 0 (10 away), wake at 30 (20 away)
    expect(grabTarget(10, 0, 30)).toBe('sleep');
  });
});

describe('durationFromAngles', () => {
  test('22:30 -> 07:00 is 8h 30m across midnight', () => {
    expect(durationFromAngles(angleFromMinutes(22 * 60 + 30), angleFromMinutes(7 * 60))).toEqual({
      hours: 8,
      minutes: 30,
    });
  });
  test('same angle is zero', () => {
    expect(durationFromAngles(90, 90)).toEqual({ hours: 0, minutes: 0 });
  });
});

describe('sleepQualityMessage buckets', () => {
  test('matches the swift switch', () => {
    expect(sleepQualityMessage(5)).toBe('Add more sleep');
    expect(sleepQualityMessage(6)).toBe('Almost ideal');
    expect(sleepQualityMessage(7)).toBe('Perfect amount!');
    expect(sleepQualityMessage(9)).toBe('Perfect amount!');
    expect(sleepQualityMessage(10)).toBe('Extra rest time');
  });
});
