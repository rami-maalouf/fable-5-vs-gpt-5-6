import {
  angleDifference,
  angleToMinutes,
  durationMinutesBetweenAngles,
  formatSleepDuration,
  getSleepQualityMessage,
  isHealthySleepDuration,
  minutesToAngle,
  nearestKnobForAngle,
  normalizeAngle,
  pointToPickerAngle,
  polarPointForAngle,
  snapAngle,
} from './circular-time-picker-geometry';

describe('circular time picker geometry', () => {
  it('maps minutes to a 24 hour clock angle', () => {
    expect(minutesToAngle(0)).toBe(0);
    expect(minutesToAngle(6 * 60)).toBe(90);
    expect(minutesToAngle(12 * 60)).toBe(180);
    expect(minutesToAngle(18 * 60)).toBe(270);
    expect(minutesToAngle(24 * 60)).toBe(0);
  });

  it('maps angles back to snapped whole minutes', () => {
    expect(angleToMinutes(0)).toBe(0);
    expect(angleToMinutes(90)).toBe(6 * 60);
    expect(angleToMinutes(360)).toBe(0);
    expect(angleToMinutes(-90)).toBe(18 * 60);
  });

  it('uses the same top-origin clockwise drag math as the Swift picker', () => {
    expect(pointToPickerAngle({ x: 50, y: 0, centerX: 50, centerY: 50 })).toBe(0);
    expect(pointToPickerAngle({ x: 100, y: 50, centerX: 50, centerY: 50 })).toBe(90);
    expect(pointToPickerAngle({ x: 50, y: 100, centerX: 50, centerY: 50 })).toBe(180);
    expect(pointToPickerAngle({ x: 0, y: 50, centerX: 50, centerY: 50 })).toBe(270);
  });

  it('keeps angle differences in the nearest direction across midnight', () => {
    expect(angleDifference(5, 355)).toBe(10);
    expect(angleDifference(355, 5)).toBe(-10);
    expect(angleDifference(180, 0)).toBe(180);
    expect(angleDifference(0, 180)).toBe(-180);
  });

  it('snaps to 1.25 degree increments for five minute steps', () => {
    expect(snapAngle(10.7)).toBe(11.25);
    expect(snapAngle(359.7)).toBe(0);
    expect(snapAngle(-1)).toBe(358.75);
  });

  it('calculates overnight duration from sleep angle to wake angle', () => {
    expect(durationMinutesBetweenAngles(minutesToAngle(22 * 60), minutesToAngle(7 * 60))).toBe(9 * 60);
    expect(durationMinutesBetweenAngles(minutesToAngle(1 * 60), minutesToAngle(9 * 60 + 30))).toBe(8 * 60 + 30);
  });

  it('selects the nearest knob within the grab threshold', () => {
    expect(nearestKnobForAngle({ angle: 353, sleepAngle: 350, wakeAngle: 110 })).toBe('sleep');
    expect(nearestKnobForAngle({ angle: 120, sleepAngle: 350, wakeAngle: 110 })).toBe('wake');
    expect(nearestKnobForAngle({ angle: 220, sleepAngle: 350, wakeAngle: 110 })).toBeNull();
    expect(nearestKnobForAngle({ angle: 100, sleepAngle: 95, wakeAngle: 105 })).toBe('wake');
  });

  it('formats duration and sleep quality copy from the Swift thresholds', () => {
    expect(formatSleepDuration(8 * 60 + 5)).toBe('8h 5m');
    expect(getSleepQualityMessage(5 * 60 + 59)).toBe('Add more sleep');
    expect(getSleepQualityMessage(6 * 60)).toBe('Almost ideal');
    expect(getSleepQualityMessage(7 * 60)).toBe('Perfect amount!');
    expect(getSleepQualityMessage(9 * 60 + 59)).toBe('Perfect amount!');
    expect(getSleepQualityMessage(10 * 60)).toBe('Extra rest time');
    expect(isHealthySleepDuration(6 * 60 + 59)).toBe(false);
    expect(isHealthySleepDuration(7 * 60)).toBe(true);
    expect(isHealthySleepDuration(9 * 60 + 59)).toBe(true);
    expect(isHealthySleepDuration(10 * 60)).toBe(false);
  });

  it('places visual elements with zero degrees at twelve o clock', () => {
    expect(polarPointForAngle({ angle: 0, center: 50, radius: 40 })).toEqual({ x: 50, y: 10 });
    expect(polarPointForAngle({ angle: 90, center: 50, radius: 40 })).toEqual({ x: 90, y: 50 });
  });

  it('normalizes negative and overflow angles', () => {
    expect(normalizeAngle(-1)).toBe(359);
    expect(normalizeAngle(361)).toBe(1);
  });
});
