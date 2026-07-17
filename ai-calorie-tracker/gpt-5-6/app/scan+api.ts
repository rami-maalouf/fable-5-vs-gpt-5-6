import { Agent, Runner } from '@openai/agents';

import { parseScanResult } from '@/domain/scan-contract';

const instructions =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';
const maxImageLength = 8_000_000;
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

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

    if (typeof result.finalOutput !== 'string') {
      return json({ error: 'analysis_failed' }, 502);
    }

    const response = parseScanResult(JSON.parse(result.finalOutput));
    return json(response, 200);
  } catch {
    return json({ error: 'analysis_failed' }, 502);
  }
}
