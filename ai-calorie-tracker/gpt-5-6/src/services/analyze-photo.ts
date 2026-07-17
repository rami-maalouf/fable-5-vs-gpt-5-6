import { parseScanResult, type ScanResult } from '@/domain/scan-contract';

export type AnalysisFailureKind = 'network' | 'analysis';

export class AnalyzePhotoError extends Error {
  constructor(public readonly kind: AnalysisFailureKind) {
    super(kind === 'network' ? 'network request failed' : 'analysis failed');
    this.name = 'AnalyzePhotoError';
  }
}

export async function analyzePhoto(
  image: string,
  signal?: AbortSignal,
): Promise<ScanResult> {
  let response: Response;

  try {
    response = await fetch('/scan', {
      body: JSON.stringify({ image }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new AnalyzePhotoError('network');
  }

  if (!response.ok) {
    throw new AnalyzePhotoError('analysis');
  }

  try {
    const payload: unknown = await response.json();
    return parseScanResult(payload);
  } catch {
    throw new AnalyzePhotoError('analysis');
  }
}
