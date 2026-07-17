import type { NutritionAnalysisSuccess } from "./nutrition";

export type ScanSource = "camera" | "library";

export type PreparedScanPhoto = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

export type ScanAnalysisResult = NutritionAnalysisSuccess;

export type ScanState =
  | {
      status: "idle";
    }
  | {
      status: "acquiring";
    }
  | {
      status: "preparing";
      source: ScanSource;
      uri: string;
    }
  | {
      status: "analyzing";
      photo: PreparedScanPhoto;
      requestId: string;
    }
  | {
      status: "result";
      photo: PreparedScanPhoto;
      requestId: string;
      result: ScanAnalysisResult;
      accepted: false;
    }
  | {
      status: "accepting";
      photo: PreparedScanPhoto;
      requestId: string;
      result: ScanAnalysisResult;
    }
  | {
      status: "not_food";
      photo: PreparedScanPhoto;
      requestId: string;
    }
  | {
      status: "analysis_error";
      photo: PreparedScanPhoto;
      requestId: string;
    }
  | {
      status: "network_error";
      photo: PreparedScanPhoto;
      requestId: string;
    };

export type ScanEvent =
  | {
      type: "open_scan";
    }
  | {
      type: "prepare_photo";
      source: ScanSource;
      uri: string;
    }
  | {
      type: "start_analysis";
      photo: PreparedScanPhoto;
      requestId: string;
    }
  | {
      type: "analysis_succeeded";
      requestId: string;
      result: ScanAnalysisResult;
    }
  | {
      type: "analysis_not_food";
      requestId: string;
    }
  | {
      type: "analysis_failed";
      requestId: string;
      reason: "analysis" | "network";
    }
  | {
      type: "retry_analysis";
      requestId: string;
    }
  | {
      type: "try_another_photo";
    }
  | {
      type: "discard";
    }
  | {
      type: "accept_result";
    }
  | {
      type: "accept_completed";
    };

export const INITIAL_SCAN_STATE: ScanState = {
  status: "idle",
};

export function reduceScanState(state: ScanState, event: ScanEvent): ScanState {
  switch (event.type) {
    case "open_scan":
      if (state.status !== "idle") {
        return state;
      }

      return { status: "acquiring" };

    case "prepare_photo":
      if (state.status !== "acquiring") {
        return state;
      }

      return {
        status: "preparing",
        source: event.source,
        uri: event.uri,
      };

    case "start_analysis":
      if (state.status !== "preparing") {
        return state;
      }

      return {
        status: "analyzing",
        photo: event.photo,
        requestId: event.requestId,
      };

    case "analysis_succeeded":
      if (!isCurrentAnalysis(state, event.requestId)) {
        return state;
      }

      return {
        status: "result",
        photo: state.photo,
        requestId: event.requestId,
        result: event.result,
        accepted: false,
      };

    case "analysis_not_food":
      if (!isCurrentAnalysis(state, event.requestId)) {
        return state;
      }

      return {
        status: "not_food",
        photo: state.photo,
        requestId: event.requestId,
      };

    case "analysis_failed":
      if (!isCurrentAnalysis(state, event.requestId)) {
        return state;
      }

      return {
        status: event.reason === "network" ? "network_error" : "analysis_error",
        photo: state.photo,
        requestId: event.requestId,
      };

    case "retry_analysis":
      if (state.status !== "analysis_error" && state.status !== "network_error") {
        return state;
      }

      return {
        status: "analyzing",
        photo: state.photo,
        requestId: event.requestId,
      };

    case "try_another_photo":
      if (state.status !== "not_food") {
        return state;
      }

      return { status: "acquiring" };

    case "discard":
      if (
        state.status !== "result" &&
        state.status !== "not_food" &&
        state.status !== "analysis_error" &&
        state.status !== "network_error"
      ) {
        return state;
      }

      return INITIAL_SCAN_STATE;

    case "accept_result":
      if (state.status !== "result") {
        return state;
      }

      return {
        status: "accepting",
        photo: state.photo,
        requestId: state.requestId,
        result: state.result,
      };

    case "accept_completed":
      if (state.status !== "accepting") {
        return state;
      }

      return INITIAL_SCAN_STATE;
  }
}

function isCurrentAnalysis(
  state: ScanState,
  requestId: string,
): state is Extract<ScanState, { status: "analyzing" }> {
  return state.status === "analyzing" && state.requestId === requestId;
}
