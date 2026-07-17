import type { ScanResult, ScanSuccess } from './scan-contract';

export type AcquisitionSource = 'camera' | 'library';

export type PreparedPhoto = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

export type ScanState =
  | { status: 'idle' }
  | { status: 'acquiring'; source: AcquisitionSource }
  | {
      status: 'preparing';
      requestId: string;
      sourceUri: string;
    }
  | {
      status: 'analyzing';
      requestId: string;
      photo: PreparedPhoto;
    }
  | {
      status: 'result';
      requestId: string;
      photo: PreparedPhoto;
      result: ScanSuccess;
    }
  | {
      status: 'error';
      kind: 'not-food' | 'network' | 'analysis';
      requestId: string;
      photo: PreparedPhoto;
    }
  | {
      status: 'accepting';
      requestId: string;
      photo: PreparedPhoto;
      result: ScanSuccess;
    };

export type ScanEvent =
  | { type: 'open'; source: AcquisitionSource }
  | {
      type: 'photo-selected';
      requestId: string;
      sourceUri: string;
    }
  | {
      type: 'photo-prepared';
      requestId: string;
      photo: PreparedPhoto;
    }
  | {
      type: 'analysis-succeeded';
      requestId: string;
      result: ScanResult;
    }
  | {
      type: 'analysis-failed';
      requestId: string;
      kind: 'network' | 'analysis';
    }
  | { type: 'retry-analysis'; requestId: string }
  | { type: 'try-another'; source: AcquisitionSource }
  | { type: 'accept' }
  | { type: 'accepted' }
  | { type: 'discard' };

export const initialScanState: ScanState = { status: 'idle' };

function canDiscard(state: ScanState) {
  return (
    state.status === 'acquiring' ||
    state.status === 'preparing' ||
    state.status === 'analyzing' ||
    state.status === 'result' ||
    state.status === 'error'
  );
}

export function scanReducer(state: ScanState, event: ScanEvent): ScanState {
  if (event.type === 'discard') {
    return canDiscard(state) ? initialScanState : state;
  }

  switch (state.status) {
    case 'idle':
      if (event.type === 'open') {
        return { status: 'acquiring', source: event.source };
      }
      return state;

    case 'acquiring':
      if (event.type === 'photo-selected') {
        return {
          status: 'preparing',
          requestId: event.requestId,
          sourceUri: event.sourceUri,
        };
      }
      return state;

    case 'preparing':
      if (
        event.type === 'photo-prepared' &&
        event.requestId === state.requestId
      ) {
        return {
          status: 'analyzing',
          requestId: event.requestId,
          photo: event.photo,
        };
      }
      return state;

    case 'analyzing':
      if (event.type === 'analysis-succeeded') {
        if (event.requestId !== state.requestId) {
          return state;
        }
        if ('error' in event.result) {
          return {
            status: 'error',
            kind: 'not-food',
            requestId: state.requestId,
            photo: state.photo,
          };
        }
        return {
          status: 'result',
          requestId: state.requestId,
          photo: state.photo,
          result: event.result,
        };
      }
      if (event.type === 'analysis-failed') {
        if (event.requestId !== state.requestId) {
          return state;
        }
        return {
          status: 'error',
          kind: event.kind,
          requestId: state.requestId,
          photo: state.photo,
        };
      }
      return state;

    case 'result':
      if (event.type === 'accept') {
        return {
          status: 'accepting',
          requestId: state.requestId,
          photo: state.photo,
          result: state.result,
        };
      }
      return state;

    case 'error':
      if (event.type === 'try-another' && state.kind === 'not-food') {
        return { status: 'acquiring', source: event.source };
      }
      if (event.type === 'retry-analysis' && state.kind !== 'not-food') {
        return {
          status: 'analyzing',
          requestId: event.requestId,
          photo: state.photo,
        };
      }
      return state;

    case 'accepting':
      if (event.type === 'accepted') {
        return initialScanState;
      }
      return state;
  }
}
