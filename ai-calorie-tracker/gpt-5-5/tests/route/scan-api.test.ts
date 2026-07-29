import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Agent, Runner } from "@openai/agents";

import { POST } from "../../app/scan+api";
import {
  MACROLENS_INSTRUCTIONS,
  MACROLENS_MODEL,
  MACROLENS_NAME,
  MAX_SCAN_IMAGE_BASE64_LENGTH,
} from "@/domain/scan-contract";

type RunnerRunMock = (...args: unknown[]) => Promise<{ finalOutput: unknown }>;

const mockRunnerRun = jest.fn<RunnerRunMock>();

jest.mock("@openai/agents", () => {
  const mockAgent = jest.fn(function Agent(config: unknown) {
    return { config };
  });

  const mockRunner = jest.fn(function Runner(config: unknown) {
    return {
      config,
      run: mockRunnerRun,
    };
  });

  return {
    Agent: mockAgent,
    Runner: mockRunner,
  };
});

const validImage = "aGVsbG8=";
const validFood = {
  food: "greek yogurt with berries",
  calories: 320,
  protein_g: 24,
  carbs_g: 38,
  fat_g: 7,
  confidence: 0.84,
};

function requestWithJson(body: unknown) {
  return new Request("http://localhost/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function requestWithBody(body: string) {
  return new Request("http://localhost/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

async function parse(response: Response) {
  return response.json() as Promise<unknown>;
}

function runnerRunMock() {
  return mockRunnerRun;
}

describe("scan api route", () => {
  let consoleError: ReturnType<typeof jest.spyOn>;
  let consoleLog: ReturnType<typeof jest.spyOn>;
  let consoleWarn: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRunnerRun.mockReset();

    consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    consoleLog = jest.spyOn(console, "log").mockImplementation(() => undefined);
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleLog.mockRestore();
    consoleWarn.mockRestore();
  });

  test("constructs the exact macrolens agent and sends one jpeg image input with tracing disabled", async () => {
    const runMock = runnerRunMock();

    runMock.mockResolvedValueOnce({ finalOutput: JSON.stringify(validFood) });

    const response = await POST(requestWithJson({ image: validImage }));

    expect(response.status).toBe(200);
    expect(await parse(response)).toEqual(validFood);
    expect(Agent).toHaveBeenCalledTimes(1);
    expect(Agent).toHaveBeenCalledWith({
      name: MACROLENS_NAME,
      model: MACROLENS_MODEL,
      instructions: MACROLENS_INSTRUCTIONS,
      outputType: expect.anything(),
    });
    expect(Runner).toHaveBeenCalledTimes(1);
    expect(Runner).toHaveBeenCalledWith({
      tracingDisabled: true,
      traceIncludeSensitiveData: false,
    });
    expect(runMock).toHaveBeenCalledTimes(1);

    const [agent, input] = runMock.mock.calls[0];

    expect(agent).toEqual({ config: expect.objectContaining({ name: MACROLENS_NAME }) });
    expect(input).toEqual([
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analyze this JPEG food photo and return only the requested JSON.",
          },
          {
            type: "input_image",
            image: `data:image/jpeg;base64,${validImage}`,
            detail: "auto",
          },
        ],
      },
    ]);
  });

  test("returns a validated not food response without treating it as an error", async () => {
    const runMock = runnerRunMock();

    runMock.mockResolvedValueOnce({
      finalOutput: {
        food: null,
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        confidence: null,
        error: "not_food",
      },
    });

    const response = await POST(requestWithJson({ image: validImage }));

    expect(response.status).toBe(200);
    expect(await parse(response)).toEqual({ error: "not_food" });
  });

  test.each([
    ["missing image", {}],
    ["empty image", { image: "  " }],
    ["data url image", { image: `data:image/jpeg;base64,${validImage}` }],
    ["malformed base64", { image: "not valid base64" }],
    ["oversized image", { image: "a".repeat(MAX_SCAN_IMAGE_BASE64_LENGTH + 1) }],
  ])("returns 400 for invalid request: %s", async (_label, body) => {
    const response = await POST(requestWithJson(body));

    expect(response.status).toBe(400);
    expect(await parse(response)).toEqual({ error: "invalid_request" });
    expect(Agent).not.toHaveBeenCalled();
    expect(Runner).not.toHaveBeenCalled();
  });

  test("returns 400 for malformed json before calling the model", async () => {
    const response = await POST(requestWithBody("{"));

    expect(response.status).toBe(400);
    expect(await parse(response)).toEqual({ error: "invalid_request" });
    expect(Agent).not.toHaveBeenCalled();
    expect(Runner).not.toHaveBeenCalled();
  });

  test.each([
    ["provider failure", new Error("provider exposed details")],
    ["malformed json", { finalOutput: "not-json" }],
    ["missing field", { finalOutput: JSON.stringify({ food: "toast" }) }],
    ["negative nutrition", { finalOutput: JSON.stringify({ ...validFood, calories: -1 }) }],
    ["confidence out of range", { finalOutput: JSON.stringify({ ...validFood, confidence: 1.1 }) }],
  ])("returns a safe 502 for %s", async (_label, modelResult) => {
    const runMock = runnerRunMock();

    if (modelResult instanceof Error) {
      runMock.mockRejectedValueOnce(modelResult);
    } else {
      runMock.mockResolvedValueOnce(modelResult);
    }

    const response = await POST(requestWithJson({ image: validImage }));

    expect(response.status).toBe(502);
    expect(await parse(response)).toEqual({ error: "analysis_failed" });
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
