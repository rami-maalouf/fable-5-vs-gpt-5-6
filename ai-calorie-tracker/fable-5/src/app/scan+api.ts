// post /scan: the only server code in the app. reads OPENAI_API_KEY from the
// server environment via the agents sdk; the key, image payload, and raw model
// output never leave this module.
import { Agent, run, setTracingDisabled } from '@openai/agents';
import { z } from 'zod';

import { parseModelOutput, parseScanRequest } from '@/domain/scan-contract';

// the food photo must not be copied into sdk trace records
setTracingDisabled(true);

// verbatim from the benchmark prompt; do not reword
export const MACROLENS_INSTRUCTIONS =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';

const macrolensOutputSchema = z
  .object({
    food: z.string().nullable(),
    calories: z.number().nonnegative().nullable(),
    protein_g: z.number().nonnegative().nullable(),
    carbs_g: z.number().nonnegative().nullable(),
    fat_g: z.number().nonnegative().nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    error: z.literal('not_food').nullable(),
  })
  .strict();

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_request' }, 400);
  }

  const scanRequest = parseScanRequest(body);
  if (scanRequest === null) {
    return jsonResponse({ error: 'invalid_request' }, 400);
  }

  const agent = new Agent({
    name: 'MacroLens',
    model: 'gpt-5.6-luna',
    instructions: MACROLENS_INSTRUCTIONS,
    outputType: macrolensOutputSchema,
  });

  try {
    const result = await run(agent, [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Identify the food in this photo.' },
          {
            type: 'input_image',
            image: `data:image/jpeg;base64,${scanRequest.image}`,
          },
        ],
      },
    ]);

    const validated = parseModelOutput(result.finalOutput);
    if (validated === null) {
      return jsonResponse({ error: 'analysis_failed' }, 502);
    }
    return jsonResponse(validated, 200);
  } catch {
    // provider, timeout, or internal failure: never echo details to the client
    return jsonResponse({ error: 'analysis_failed' }, 502);
  }
}
