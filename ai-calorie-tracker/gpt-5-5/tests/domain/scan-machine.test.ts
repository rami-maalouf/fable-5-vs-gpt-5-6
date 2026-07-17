import { describe, expect, test } from "@jest/globals";

import {
  INITIAL_SCAN_STATE,
  reduceScanState,
  type PreparedScanPhoto,
  type ScanAnalysisResult,
  type ScanState,
} from "../../src/domain/scan-machine";

const preparedPhoto: PreparedScanPhoto = {
  uri: "file:///prepared.jpg",
  base64: "abcd",
  width: 1024,
  height: 768,
};

const result: ScanAnalysisResult = {
  food: "grain bowl",
  calories: 640,
  protein_g: 34,
  carbs_g: 78,
  fat_g: 22,
  confidence: 0.88,
};

function analyzing(requestId = "request-1"): ScanState {
  return {
    status: "analyzing",
    photo: preparedPhoto,
    requestId,
  };
}

describe("scan state machine", () => {
  test("walks through the legal happy path states", () => {
    const acquiring = reduceScanState(INITIAL_SCAN_STATE, { type: "open_scan" });
    expect(acquiring).toEqual({ status: "acquiring" });

    const preparing = reduceScanState(acquiring, {
      type: "prepare_photo",
      source: "library",
      uri: "file:///original.jpg",
    });
    expect(preparing).toEqual({
      status: "preparing",
      source: "library",
      uri: "file:///original.jpg",
    });

    const started = reduceScanState(preparing, {
      type: "start_analysis",
      photo: preparedPhoto,
      requestId: "request-1",
    });
    expect(started).toEqual(analyzing());

    const completed = reduceScanState(started, {
      type: "analysis_succeeded",
      requestId: "request-1",
      result,
    });
    expect(completed).toEqual({
      status: "result",
      photo: preparedPhoto,
      requestId: "request-1",
      result,
      accepted: false,
    });

    const accepting = reduceScanState(completed, { type: "accept_result" });
    expect(accepting).toEqual({
      status: "accepting",
      photo: preparedPhoto,
      requestId: "request-1",
      result,
    });

    expect(reduceScanState(accepting, { type: "accept_completed" })).toEqual(INITIAL_SCAN_STATE);
  });

  test("discards result and error states without carrying state forward", () => {
    const resultState = reduceScanState(analyzing(), {
      type: "analysis_succeeded",
      requestId: "request-1",
      result,
    });
    const errorState = reduceScanState(analyzing(), {
      type: "analysis_failed",
      requestId: "request-1",
      reason: "network",
    });

    expect(reduceScanState(resultState, { type: "discard" })).toEqual(INITIAL_SCAN_STATE);
    expect(reduceScanState(errorState, { type: "discard" })).toEqual(INITIAL_SCAN_STATE);
  });

  test("recovers from not-food by choosing another photo", () => {
    const notFood = reduceScanState(analyzing(), {
      type: "analysis_not_food",
      requestId: "request-1",
    });

    expect(notFood).toEqual({
      status: "not_food",
      photo: preparedPhoto,
      requestId: "request-1",
    });
    expect(reduceScanState(notFood, { type: "try_another_photo" })).toEqual({
      status: "acquiring",
    });
  });

  test("retries recoverable failures against the same prepared photo with a new request id", () => {
    const failed = reduceScanState(analyzing(), {
      type: "analysis_failed",
      requestId: "request-1",
      reason: "analysis",
    });

    expect(failed).toEqual({
      status: "analysis_error",
      photo: preparedPhoto,
      requestId: "request-1",
    });
    expect(
      reduceScanState(failed, {
        type: "retry_analysis",
        requestId: "request-2",
      }),
    ).toEqual({
      status: "analyzing",
      photo: preparedPhoto,
      requestId: "request-2",
    });
  });

  test("returns to acquisition when image preparation fails", () => {
    const acquiring = reduceScanState(INITIAL_SCAN_STATE, { type: "open_scan" });
    const preparing = reduceScanState(acquiring, {
      type: "prepare_photo",
      source: "library",
      uri: "file:///original.jpg",
    });

    expect(reduceScanState(preparing, { type: "preparation_failed" })).toEqual({
      status: "acquiring",
    });
  });

  test("distinguishes network failures from provider analysis failures", () => {
    expect(
      reduceScanState(analyzing(), {
        type: "analysis_failed",
        requestId: "request-1",
        reason: "network",
      }),
    ).toEqual({
      status: "network_error",
      photo: preparedPhoto,
      requestId: "request-1",
    });
  });

  test("accepts a result only once", () => {
    const resultState = reduceScanState(analyzing(), {
      type: "analysis_succeeded",
      requestId: "request-1",
      result,
    });
    const accepting = reduceScanState(resultState, { type: "accept_result" });

    expect(reduceScanState(accepting, { type: "accept_result" })).toBe(accepting);
  });

  test("ignores stale and out-of-order analysis responses", () => {
    const current = analyzing("request-2");

    expect(
      reduceScanState(current, {
        type: "analysis_succeeded",
        requestId: "request-1",
        result,
      }),
    ).toBe(current);
    expect(
      reduceScanState(current, {
        type: "analysis_failed",
        requestId: "request-1",
        reason: "network",
      }),
    ).toBe(current);
    expect(
      reduceScanState(INITIAL_SCAN_STATE, {
        type: "analysis_succeeded",
        requestId: "request-2",
        result,
      }),
    ).toBe(INITIAL_SCAN_STATE);
  });

  test("ignores illegal events for the current state", () => {
    const acquiring = reduceScanState(INITIAL_SCAN_STATE, { type: "open_scan" });

    expect(reduceScanState(INITIAL_SCAN_STATE, { type: "accept_result" })).toBe(INITIAL_SCAN_STATE);
    expect(reduceScanState(acquiring, { type: "retry_analysis", requestId: "request-2" })).toBe(
      acquiring,
    );
  });
});
