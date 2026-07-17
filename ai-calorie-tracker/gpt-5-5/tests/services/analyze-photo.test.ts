import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import type { PreparedScanPhoto } from "../../src/domain/scan-machine";
import {
  AnalyzePhotoError,
  analyzePreparedPhoto,
} from "../../src/services/analyze-photo";

const preparedPhoto: PreparedScanPhoto = {
  uri: "file:///prepared.jpg",
  base64: "jpeg-base64",
  width: 1024,
  height: 768,
};

const mockFetch = jest.fn<typeof fetch>();

describe("analyzePreparedPhoto", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  test("posts only the prepared base64 and returns validated food analysis", async () => {
    const signal = new AbortController().signal;
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          food: "grain bowl",
          calories: 640,
          protein_g: 34,
          carbs_g: 78,
          fat_g: 22,
          confidence: 0.88,
        }),
        { status: 200 },
      ),
    );

    await expect(analyzePreparedPhoto(preparedPhoto, { signal })).resolves.toEqual({
      type: "food",
      result: {
        food: "grain bowl",
        calories: 640,
        protein_g: 34,
        carbs_g: 78,
        fat_g: 22,
        confidence: 0.88,
      },
    });
    expect(mockFetch).toHaveBeenCalledWith("/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: "jpeg-base64" }),
      signal,
    });
  });

  test("returns not-food when the route validates a non-food image", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: "not_food" }), { status: 200 }));

    await expect(analyzePreparedPhoto(preparedPhoto)).resolves.toEqual({
      type: "not_food",
    });
  });

  test("treats invalid success payloads as analysis failures", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ food: "soup" }), { status: 200 }));

    await expect(analyzePreparedPhoto(preparedPhoto)).rejects.toEqual(
      new AnalyzePhotoError("analysis"),
    );
  });

  test("distinguishes safe route failures from transport failures", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "analysis_failed" }), { status: 502 }),
    );
    await expect(analyzePreparedPhoto(preparedPhoto)).rejects.toEqual(
      new AnalyzePhotoError("analysis"),
    );

    mockFetch.mockRejectedValueOnce(new TypeError("network down"));
    await expect(analyzePreparedPhoto(preparedPhoto)).rejects.toEqual(
      new AnalyzePhotoError("network"),
    );
  });
});
