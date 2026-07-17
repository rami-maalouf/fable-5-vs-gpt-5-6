import {
  INITIAL_SCAN_STATE,
  scanReducer,
  type PreparedPhoto,
  type ScanEvent,
  type ScanMachineState,
} from '../../src/domain/scan-machine';

const PHOTO: PreparedPhoto = {
  uri: 'file:///prepared/photo-1.jpg',
  base64: 'aGVsbG8=',
  width: 1024,
  height: 768,
};

const RESULT = {
  food: 'Ramen bowl',
  calories: 610,
  protein_g: 28,
  carbs_g: 78.5,
  fat_g: 19,
  confidence: 0.81,
};

function reduce(events: ScanEvent[], from = INITIAL_SCAN_STATE) {
  return events.reduce(scanReducer, from);
}

const TO_ANALYZING: ScanEvent[] = [
  { type: 'start_preparing', displayUri: 'file:///raw/photo-1.jpg' },
  { type: 'photo_prepared', photo: PHOTO },
];

describe('happy path', () => {
  it('walks acquiring -> preparing -> analyzing -> result -> accepted', () => {
    let state = INITIAL_SCAN_STATE;
    expect(state.screen.status).toBe('acquiring');

    state = scanReducer(state, {
      type: 'start_preparing',
      displayUri: 'file:///raw/photo-1.jpg',
    });
    expect(state.screen).toEqual({
      status: 'preparing',
      displayUri: 'file:///raw/photo-1.jpg',
    });

    state = scanReducer(state, { type: 'photo_prepared', photo: PHOTO });
    expect(state.screen).toEqual({
      status: 'analyzing',
      photo: PHOTO,
      requestId: 1,
    });

    state = scanReducer(state, {
      type: 'analysis_succeeded',
      requestId: 1,
      result: RESULT,
    });
    expect(state.screen).toEqual({
      status: 'result',
      photo: PHOTO,
      requestId: 1,
      result: RESULT,
      accepted: false,
    });

    state = scanReducer(state, { type: 'accept' });
    expect(state.screen).toMatchObject({ status: 'result', accepted: true });
  });

  it('keeps the same photo object from analyzing through result', () => {
    const analyzing = reduce(TO_ANALYZING);
    const result = scanReducer(analyzing, {
      type: 'analysis_succeeded',
      requestId: 1,
      result: RESULT,
    });
    expect(
      result.screen.status === 'result' && result.screen.photo,
    ).toBe(PHOTO);
  });
});

describe('accept-once', () => {
  it('ignores a duplicate accept', () => {
    const accepted = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_succeeded', requestId: 1, result: RESULT },
      { type: 'accept' },
    ]);
    const again = scanReducer(accepted, { type: 'accept' });
    expect(again).toBe(accepted);
  });

  it('ignores accept outside the result state', () => {
    const analyzing = reduce(TO_ANALYZING);
    expect(scanReducer(analyzing, { type: 'accept' })).toBe(analyzing);
  });
});

describe('failures and retries', () => {
  it('maps not-food to its own state and retries through acquisition', () => {
    const notFood = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_not_food', requestId: 1 },
    ]);
    expect(notFood.screen).toEqual({ status: 'not_food', photo: PHOTO });

    const backToAcquiring = scanReducer(notFood, { type: 'try_another_photo' });
    expect(backToAcquiring.screen).toEqual({ status: 'acquiring' });
  });

  it('retries a network failure with the same photo and a new request id', () => {
    const failed = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_failed', requestId: 1, reason: 'network' },
    ]);
    expect(failed.screen).toEqual({
      status: 'failed',
      photo: PHOTO,
      reason: 'network',
    });

    const retried = scanReducer(failed, { type: 'retry_analysis' });
    expect(retried.screen).toEqual({
      status: 'analyzing',
      photo: PHOTO,
      requestId: 2,
    });
  });

  it('does not allow retry_analysis from not_food', () => {
    const notFood = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_not_food', requestId: 1 },
    ]);
    expect(scanReducer(notFood, { type: 'retry_analysis' })).toBe(notFood);
  });

  it('returns to acquisition when preparation fails or is cancelled', () => {
    const preparing = reduce([
      { type: 'start_preparing', displayUri: 'file:///raw/photo-1.jpg' },
    ]);
    expect(
      scanReducer(preparing, { type: 'preparation_failed' }).screen,
    ).toEqual({ status: 'acquiring' });
    expect(
      scanReducer(preparing, { type: 'cancel_acquisition' }).screen,
    ).toEqual({ status: 'acquiring' });
  });
});

describe('stale and out-of-order responses', () => {
  it('ignores a response with a stale request id after retry', () => {
    const retried = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_failed', requestId: 1, reason: 'network' },
      { type: 'retry_analysis' },
    ]);
    // late completion of the original request must not change the screen
    const afterStale = scanReducer(retried, {
      type: 'analysis_succeeded',
      requestId: 1,
      result: RESULT,
    });
    expect(afterStale).toBe(retried);

    // the active request still completes normally
    const done = scanReducer(afterStale, {
      type: 'analysis_succeeded',
      requestId: 2,
      result: RESULT,
    });
    expect(done.screen).toMatchObject({ status: 'result', requestId: 2 });
  });

  it('ignores every analysis event after discard', () => {
    const discarded = reduce([...TO_ANALYZING, { type: 'discard' }]);
    expect(discarded.screen).toEqual({ status: 'closed' });

    const events: ScanEvent[] = [
      { type: 'analysis_succeeded', requestId: 1, result: RESULT },
      { type: 'analysis_not_food', requestId: 1 },
      { type: 'analysis_failed', requestId: 1, reason: 'analysis' },
      { type: 'accept' },
      { type: 'retry_analysis' },
    ];
    for (const event of events) {
      expect(scanReducer(discarded, event)).toBe(discarded);
    }
  });

  it('never reuses a request id across photos', () => {
    const secondPhoto: PreparedPhoto = { ...PHOTO, uri: 'file:///raw/2.jpg' };
    const state = reduce([
      ...TO_ANALYZING,
      { type: 'analysis_not_food', requestId: 1 },
      { type: 'try_another_photo' },
      { type: 'start_preparing', displayUri: 'file:///raw/2.jpg' },
      { type: 'photo_prepared', photo: secondPhoto },
    ]);
    expect(state.screen).toMatchObject({ status: 'analyzing', requestId: 2 });
  });
});

describe('illegal events', () => {
  const analyzing = reduce(TO_ANALYZING);

  const cases: [string, ScanMachineState, ScanEvent][] = [
    [
      'start_preparing while analyzing',
      analyzing,
      { type: 'start_preparing', displayUri: 'x' },
    ],
    [
      'photo_prepared while acquiring',
      INITIAL_SCAN_STATE,
      { type: 'photo_prepared', photo: PHOTO },
    ],
    [
      'analysis_succeeded while acquiring',
      INITIAL_SCAN_STATE,
      { type: 'analysis_succeeded', requestId: 1, result: RESULT },
    ],
    ['try_another_photo while analyzing', analyzing, { type: 'try_another_photo' }],
    ['retry_analysis while analyzing', analyzing, { type: 'retry_analysis' }],
  ];

  it.each(cases)('%s leaves state unchanged', (_label, state, event) => {
    expect(scanReducer(state, event)).toBe(state);
  });

  it('discard closes from every photo-bearing state', () => {
    for (const events of [
      TO_ANALYZING,
      [...TO_ANALYZING, { type: 'analysis_succeeded', requestId: 1, result: RESULT } as ScanEvent],
      [...TO_ANALYZING, { type: 'analysis_not_food', requestId: 1 } as ScanEvent],
      [...TO_ANALYZING, { type: 'analysis_failed', requestId: 1, reason: 'analysis' } as ScanEvent],
    ]) {
      const state = reduce(events);
      expect(scanReducer(state, { type: 'discard' }).screen).toEqual({
        status: 'closed',
      });
    }
  });
});
