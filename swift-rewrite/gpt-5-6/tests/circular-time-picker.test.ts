import {
  angleToSnappedMinutes,
  durationQuality,
  getArcSegments,
  minutesToAngle,
  pickClosestKnob,
  pointToAngle,
  sleepDurationMinutes,
} from '../src/components/common/circularTimePickerModel';

describe('circular time picker geometry', () => {
  it('maps a 24-hour clock clockwise from the top', () => {
    expect(minutesToAngle(0)).toBe(0);
    expect(minutesToAngle(6 * 60)).toBe(90);
    expect(minutesToAngle(12 * 60)).toBe(180);
    expect(minutesToAngle(18 * 60)).toBe(270);

    expect(pointToAngle(100, 0, 100, 100)).toBe(0);
    expect(pointToAngle(200, 100, 100, 100)).toBe(90);
    expect(pointToAngle(100, 200, 100, 100)).toBe(180);
    expect(pointToAngle(0, 100, 100, 100)).toBe(270);
  });

  it('snaps every drag to five-minute increments', () => {
    expect(angleToSnappedMinutes(90)).toBe(360);
    expect(angleToSnappedMinutes(91.2)).toBe(365);
    expect(angleToSnappedMinutes(359.8)).toBe(0);
  });

  it('selects the nearest knob only inside the grab threshold', () => {
    expect(pickClosestKnob(8, 5, 110)).toBe('sleep');
    expect(pickClosestKnob(106, 5, 110)).toBe('wake');
    expect(pickClosestKnob(60, 5, 110)).toBeNull();
    expect(pickClosestKnob(358, 2, 120)).toBe('sleep');
  });

  it('splits a midnight-crossing arc into two visible segments', () => {
    expect(getArcSegments(22 * 60, 7 * 60 + 30)).toEqual([
      { startAngle: 330, sweepAngle: 30 },
      { startAngle: 0, sweepAngle: 112.5 },
    ]);
    expect(getArcSegments(30, 7 * 60 + 30)).toEqual([
      { startAngle: 7.5, sweepAngle: 105 },
    ]);
  });
});

describe('circular time picker copy', () => {
  it('calculates overnight duration and quality boundaries', () => {
    expect(sleepDurationMinutes(22 * 60 + 30, 7 * 60 + 30)).toBe(9 * 60);
    expect(durationQuality(359).message).toBe('Add more sleep');
    expect(durationQuality(360).message).toBe('Almost ideal');
    expect(durationQuality(420).message).toBe('Perfect amount!');
    expect(durationQuality(540).message).toBe('Perfect amount!');
    expect(durationQuality(541).message).toBe('Extra rest time');
  });
});
