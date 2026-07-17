import {
  initialScanState,
  scanReducer,
  type PreparedPhoto,
  type ScanState,
} from '../../src/domain/scan-machine';

const photo: PreparedPhoto = {
  uri: 'file:///prepared.jpg',
  base64: '/9j/food',
  width: 1024,
  height: 768,
};

const result = {
  food: 'Chicken bowl',
  calories: 640,
  protein_g: 52,
  carbs_g: 61,
  fat_g: 21,
  confidence: 0.93,
};

function analyzing(requestId = 'request-1'): ScanState {
  return {
    status: 'analyzing',
    requestId,
    photo,
  };
}

describe('scanReducer', () => {
  it('moves through acquisition, preparation, analysis, result, and acceptance', () => {
    const acquiring = scanReducer(initialScanState, {
      type: 'open',
      source: 'library',
    });
    const preparing = scanReducer(acquiring, {
      type: 'photo-selected',
      requestId: 'request-1',
      sourceUri: 'file:///original.jpg',
    });
    const analysis = scanReducer(preparing, {
      type: 'photo-prepared',
      requestId: 'request-1',
      photo,
    });
    const completed = scanReducer(analysis, {
      type: 'analysis-succeeded',
      requestId: 'request-1',
      result,
    });
    const accepting = scanReducer(completed, { type: 'accept' });

    expect(acquiring).toEqual({ status: 'acquiring', source: 'library' });
    expect(preparing).toEqual({
      status: 'preparing',
      requestId: 'request-1',
      sourceUri: 'file:///original.jpg',
    });
    expect(analysis).toEqual(analyzing());
    expect(completed).toEqual({
      status: 'result',
      requestId: 'request-1',
      photo,
      result,
    });
    expect(accepting).toEqual({
      status: 'accepting',
      requestId: 'request-1',
      photo,
      result,
    });
    expect(scanReducer(accepting, { type: 'accept' })).toBe(accepting);
    expect(scanReducer(accepting, { type: 'accepted' })).toBe(initialScanState);
  });

  it('ignores stale preparation and out-of-order analysis responses', () => {
    const preparation: ScanState = {
      status: 'preparing',
      requestId: 'request-current',
      sourceUri: 'file:///original.jpg',
    };
    const analysis = analyzing('request-current');

    expect(
      scanReducer(preparation, {
        type: 'photo-prepared',
        requestId: 'request-stale',
        photo,
      }),
    ).toBe(preparation);
    expect(
      scanReducer(analysis, {
        type: 'analysis-succeeded',
        requestId: 'request-stale',
        result,
      }),
    ).toBe(analysis);
    expect(
      scanReducer(analysis, {
        type: 'analysis-failed',
        requestId: 'request-stale',
        kind: 'network',
      }),
    ).toBe(analysis);
  });

  it('maps not-food to its recoverable error and can acquire another photo', () => {
    const error = scanReducer(analyzing(), {
      type: 'analysis-succeeded',
      requestId: 'request-1',
      result: { error: 'not_food' },
    });

    expect(error).toEqual({
      status: 'error',
      kind: 'not-food',
      requestId: 'request-1',
      photo,
    });
    expect(scanReducer(error, { type: 'try-another', source: 'camera' })).toEqual({
      status: 'acquiring',
      source: 'camera',
    });
  });

  it.each(['network', 'analysis'] as const)(
    'retries a %s failure against the same photo with a new request id',
    (kind) => {
      const error = scanReducer(analyzing(), {
        type: 'analysis-failed',
        requestId: 'request-1',
        kind,
      });

      expect(error).toEqual({
        status: 'error',
        kind,
        requestId: 'request-1',
        photo,
      });
      expect(
        scanReducer(error, { type: 'retry-analysis', requestId: 'request-2' }),
      ).toEqual({
        status: 'analyzing',
        requestId: 'request-2',
        photo,
      });
    },
  );

  it.each([
    { status: 'acquiring', source: 'library' } as ScanState,
    {
      status: 'preparing',
      requestId: 'request-1',
      sourceUri: 'file:///original.jpg',
    } as ScanState,
    analyzing(),
    {
      status: 'result',
      requestId: 'request-1',
      photo,
      result,
    } as ScanState,
    {
      status: 'error',
      kind: 'network',
      requestId: 'request-1',
      photo,
    } as ScanState,
  ])('discards %s without retaining scan data', (state) => {
    expect(scanReducer(state, { type: 'discard' })).toBe(initialScanState);
  });

  it('returns the same state for illegal events', () => {
    expect(scanReducer(initialScanState, { type: 'accept' })).toBe(initialScanState);
    expect(scanReducer(analyzing(), { type: 'accepted' })).toEqual(analyzing());
    expect(
      scanReducer(
        {
          status: 'error',
          kind: 'not-food',
          requestId: 'request-1',
          photo,
        },
        { type: 'retry-analysis', requestId: 'request-2' },
      ),
    ).toEqual({
      status: 'error',
      kind: 'not-food',
      requestId: 'request-1',
      photo,
    });
  });
});
