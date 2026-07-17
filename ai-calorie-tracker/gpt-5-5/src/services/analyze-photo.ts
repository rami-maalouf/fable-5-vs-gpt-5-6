import { parseNutritionAnalysis, type NutritionAnalysisSuccess } from "@/domain/nutrition";
import type { PreparedScanPhoto } from "@/domain/scan-machine";

export type AnalyzePreparedPhotoResult =
  | {
      type: "food";
      result: NutritionAnalysisSuccess;
    }
  | {
      type: "not_food";
    };

export class AnalyzePhotoError extends Error {
  readonly reason: "analysis" | "network";

  constructor(reason: "analysis" | "network") {
    super(`photo analysis ${reason} failure`);
    this.name = "AnalyzePhotoError";
    this.reason = reason;
  }
}

export async function analyzePreparedPhoto(
  photo: PreparedScanPhoto,
  options: { signal?: AbortSignal } = {},
): Promise<AnalyzePreparedPhotoResult> {
  let response: Response;

  try {
    response = await fetch("/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: photo.base64 }),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted || isAbortError(error)) {
      throw error;
    }

    throw new AnalyzePhotoError("network");
  }

  if (!response.ok) {
    throw new AnalyzePhotoError(response.status === 502 ? "analysis" : "network");
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new AnalyzePhotoError("analysis");
  }

  const parsed = parseNutritionAnalysis(body);

  if (!parsed) {
    throw new AnalyzePhotoError("analysis");
  }

  if ("error" in parsed) {
    return { type: "not_food" };
  }

  return {
    type: "food",
    result: parsed,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
