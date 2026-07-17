// typed client for post /scan. expo router api routes resolve relative
// fetch urls against the dev-server origin, so the route works in native
// dev builds without a hardcoded host. this module never logs the image
// base64, the response payload, or any error detail.
import {
  isNotFood,
  parseScanResponse,
  type ScanSuccess,
} from '@/domain/scan-contract';
import type { FailureReason } from '@/domain/scan-machine';

export type AnalysisOutcome =
  | { kind: 'success'; result: ScanSuccess }
  | { kind: 'not_food' }
  | { kind: 'failure'; reason: FailureReason }
  // the caller aborted; nothing should be dispatched for this request
  | { kind: 'aborted' };

// sends one prepared jpeg (raw base64) for analysis. never throws: every
// outcome, including cancellation, is a typed value.
export async function analyzePhoto(
  image: string,
  signal?: AbortSignal,
): Promise<AnalysisOutcome> {
  let response: Response;
  try {
    response = await fetch('/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
      signal,
    });
  } catch {
    if (signal?.aborted) {
      return { kind: 'aborted' };
    }
    // fetch itself failed: transport problem, retryable with the same image
    return { kind: 'failure', reason: 'network' };
  }

  if (response.status !== 200) {
    // 400 and 502 are safe server-side failures; treat every non-200 as a
    // recoverable analysis failure
    return { kind: 'failure', reason: 'analysis' };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (signal?.aborted) {
      return { kind: 'aborted' };
    }
    return { kind: 'failure', reason: 'analysis' };
  }

  // validate at the boundary; an invalid 200 body is an analysis failure
  const parsed = parseScanResponse(payload);
  if (parsed === null) {
    return { kind: 'failure', reason: 'analysis' };
  }
  if (isNotFood(parsed)) {
    return { kind: 'not_food' };
  }
  return { kind: 'success', result: parsed };
}
