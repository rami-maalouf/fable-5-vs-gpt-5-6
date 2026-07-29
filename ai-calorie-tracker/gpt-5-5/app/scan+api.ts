import { Agent, Runner, type AgentInputItem } from "@openai/agents";
import { z } from "zod";

import {
  MACROLENS_INSTRUCTIONS,
  MACROLENS_MODEL,
  MACROLENS_NAME,
  parseScanModelOutput,
  parseScanRequestBody,
} from "@/domain/scan-contract";

const ANALYZE_PHOTO_TEXT = "Analyze this JPEG food photo and return only the requested JSON.";
const macrolensOutputSchema = z
  .object({
    food: z.string().nullable(),
    calories: z.number().nonnegative().nullable(),
    protein_g: z.number().nonnegative().nullable(),
    carbs_g: z.number().nonnegative().nullable(),
    fat_g: z.number().nonnegative().nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    error: z.literal("not_food").nullable(),
  })
  .strict();

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const parsedRequest = parseScanRequestBody(body);

  if (!parsedRequest.ok) {
    return json({ error: "invalid_request" }, 400);
  }

  try {
    const agent = new Agent({
      name: MACROLENS_NAME,
      model: MACROLENS_MODEL,
      instructions: MACROLENS_INSTRUCTIONS,
      outputType: macrolensOutputSchema,
    });
    const runner = new Runner({
      tracingDisabled: true,
      traceIncludeSensitiveData: false,
    });
    const input: AgentInputItem[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: ANALYZE_PHOTO_TEXT,
          },
          {
            type: "input_image",
            image: `data:image/jpeg;base64,${parsedRequest.image}`,
            detail: "auto",
          },
        ],
      },
    ];
    const result = await runner.run(agent, input);
    const scanResult = parseScanModelOutput(result.finalOutput);

    if (!scanResult) {
      return json({ error: "analysis_failed" }, 502);
    }

    return json(scanResult, 200);
  } catch {
    return json({ error: "analysis_failed" }, 502);
  }
}

function json(body: { error: "invalid_request" | "analysis_failed" } | object, status: number) {
  return Response.json(body, { status });
}
