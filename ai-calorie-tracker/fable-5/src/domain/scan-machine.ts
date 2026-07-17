// pure scan-flow state machine. screens render this state; they never
// coordinate independent flags. illegal events leave the state unchanged.
import type { ScanSuccess } from './scan-contract';

export type PreparedPhoto = {
  // local file uri for display and the eventual meal thumbnail
  uri: string;
  // raw base64 of the exact prepared jpeg, no data-url prefix
  base64: string;
  width: number;
  height: number;
};

export type FailureReason = 'analysis' | 'network';

export type ScanScreenState =
  | { status: 'acquiring' }
  | { status: 'preparing'; displayUri: string }
  | { status: 'analyzing'; photo: PreparedPhoto; requestId: number }
  | {
      status: 'result';
      photo: PreparedPhoto;
      requestId: number;
      result: ScanSuccess;
      accepted: boolean;
    }
  | { status: 'not_food'; photo: PreparedPhoto }
  | { status: 'failed'; photo: PreparedPhoto; reason: FailureReason }
  | { status: 'closed' };

export type ScanMachineState = {
  screen: ScanScreenState;
  // monotonically increasing so late responses from replaced, retried, or
  // discarded photos can never change the current screen
  lastRequestId: number;
};

export type ScanEvent =
  | { type: 'start_preparing'; displayUri: string }
  | { type: 'cancel_acquisition' }
  | { type: 'photo_prepared'; photo: PreparedPhoto }
  | { type: 'preparation_failed' }
  | { type: 'analysis_succeeded'; requestId: number; result: ScanSuccess }
  | { type: 'analysis_not_food'; requestId: number }
  | { type: 'analysis_failed'; requestId: number; reason: FailureReason }
  | { type: 'retry_analysis' }
  | { type: 'try_another_photo' }
  | { type: 'accept' }
  | { type: 'discard' };

export const INITIAL_SCAN_STATE: ScanMachineState = {
  screen: { status: 'acquiring' },
  lastRequestId: 0,
};

function startAnalysis(
  state: ScanMachineState,
  photo: PreparedPhoto,
): ScanMachineState {
  const requestId = state.lastRequestId + 1;
  return {
    screen: { status: 'analyzing', photo, requestId },
    lastRequestId: requestId,
  };
}

export function scanReducer(
  state: ScanMachineState,
  event: ScanEvent,
): ScanMachineState {
  const { screen } = state;

  switch (event.type) {
    case 'start_preparing': {
      if (screen.status !== 'acquiring') {
        return state;
      }
      return {
        ...state,
        screen: { status: 'preparing', displayUri: event.displayUri },
      };
    }

    case 'cancel_acquisition': {
      if (screen.status !== 'acquiring' && screen.status !== 'preparing') {
        return state;
      }
      return { ...state, screen: { status: 'acquiring' } };
    }

    case 'photo_prepared': {
      if (screen.status !== 'preparing') {
        return state;
      }
      return startAnalysis(state, event.photo);
    }

    case 'preparation_failed': {
      if (screen.status !== 'preparing') {
        return state;
      }
      return { ...state, screen: { status: 'acquiring' } };
    }

    case 'analysis_succeeded': {
      if (
        screen.status !== 'analyzing' ||
        screen.requestId !== event.requestId
      ) {
        return state;
      }
      return {
        ...state,
        screen: {
          status: 'result',
          photo: screen.photo,
          requestId: screen.requestId,
          result: event.result,
          accepted: false,
        },
      };
    }

    case 'analysis_not_food': {
      if (
        screen.status !== 'analyzing' ||
        screen.requestId !== event.requestId
      ) {
        return state;
      }
      return { ...state, screen: { status: 'not_food', photo: screen.photo } };
    }

    case 'analysis_failed': {
      if (
        screen.status !== 'analyzing' ||
        screen.requestId !== event.requestId
      ) {
        return state;
      }
      return {
        ...state,
        screen: {
          status: 'failed',
          photo: screen.photo,
          reason: event.reason,
        },
      };
    }

    case 'retry_analysis': {
      if (screen.status !== 'failed') {
        return state;
      }
      return startAnalysis(state, screen.photo);
    }

    case 'try_another_photo': {
      if (screen.status !== 'not_food') {
        return state;
      }
      return { ...state, screen: { status: 'acquiring' } };
    }

    case 'accept': {
      if (screen.status !== 'result' || screen.accepted) {
        return state;
      }
      return { ...state, screen: { ...screen, accepted: true } };
    }

    case 'discard': {
      if (screen.status === 'closed') {
        return state;
      }
      return { ...state, screen: { status: 'closed' } };
    }
  }
}
