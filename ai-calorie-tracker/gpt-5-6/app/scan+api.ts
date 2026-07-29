import { Agent, Runner } from '@openai/agents';
import { z } from 'zod';

import { parseScanResult } from '@/domain/scan-contract';

const instructions =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';
const maxImageLength = 8_000_000;
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
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

function isJpegBase64(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 4 &&
    value.length <= maxImageLength &&
    value.length % 4 === 0 &&
    value.startsWith('/9j/') &&
    base64Pattern.test(value)
  );
}

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

function parseModelOutput(output: unknown) {
  const value = typeof output === 'string' ? JSON.parse(output) : output;
  const structured = macrolensOutputSchema.safeParse(value);

  if (!structured.success) {
    return parseScanResult(value);
  }

  if (structured.data.error === 'not_food') {
    return { error: 'not_food' } as const;
  }

  return parseScanResult({
    food: structured.data.food,
    calories: structured.data.calories,
    protein_g: structured.data.protein_g,
    carbs_g: structured.data.carbs_g,
    fat_g: structured.data.fat_g,
    confidence: structured.data.confidence,
  });
}

export async function POST(request: Request): Promise<Response> {
  let image: unknown;

  try {
    const body = await request.json();
    image = body?.image;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  if (!isJpegBase64(image)) {
    return json({ error: 'invalid_request' }, 400);
  }

  try {
    const agent = new Agent({
      name: 'MacroLens',
      model: 'gpt-5.6-luna',
      instructions,
      outputType: macrolensOutputSchema,
    });
    const runner = new Runner({ tracingDisabled: true });
    const result = await runner.run(
      agent,
      [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Analyze this food photo.' },
            { type: 'input_image', image: `data:image/jpeg;base64,${image}` },
          ],
        },
      ],
    );

    const response = parseModelOutput(result.finalOutput);
    return json(response, 200);
  } catch {
    return json({ error: 'analysis_failed' }, 502);
  }
}
