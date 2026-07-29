const mockRun = jest.fn();
const mockAgent = jest.fn();
const mockRunner = jest.fn();

jest.mock('@openai/agents', () => ({
  Agent: class MockAgent {
    constructor(configuration: unknown) {
      mockAgent(configuration);
    }
  },
  Runner: class MockRunner {
    run = (...arguments_: unknown[]) => mockRun(...arguments_);

    constructor(configuration: unknown) {
      mockRunner(configuration);
    }
  },
}));

import { POST } from '../../app/scan+api';

const instructions =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';
const image = '/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==';

function request(body: unknown) {
  return new Request('http://localhost/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /scan', () => {
  beforeEach(() => {
    mockAgent.mockClear();
    mockRunner.mockClear();
    mockRun.mockReset();
  });

  it.each([undefined, null, {}, { image: '' }, { image: 'not-base64' }])(
    'rejects invalid input before invoking the model: %p',
    async (body) => {
      const response = await POST(request(body));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'invalid_request' });
      expect(mockAgent).not.toHaveBeenCalled();
      expect(mockRun).not.toHaveBeenCalled();
    },
  );

  it('rejects an unreasonably large image before invoking the model', async () => {
    const response = await POST(request({ image: `/9j/${'A'.repeat(8_000_000)}` }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_request' });
    expect(mockAgent).not.toHaveBeenCalled();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('uses the exact MacroLens configuration and one jpeg input', async () => {
    mockRun.mockResolvedValue({
      finalOutput:
        '{"food":"Greek yogurt","calories":180,"protein_g":20,"carbs_g":16,"fat_g":4,"confidence":0.91}',
    });

    const response = await POST(request({ image }));

    expect(mockAgent).toHaveBeenCalledWith({
      name: 'MacroLens',
      model: 'gpt-5.6-luna',
      instructions,
      outputType: expect.anything(),
    });
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
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
    expect(mockRunner).toHaveBeenCalledWith({ tracingDisabled: true });
    expect(response.status).toBe(200);
  });

  it.each([
    {
      food: 'Greek yogurt',
      calories: 180,
      protein_g: 20,
      carbs_g: 16,
      fat_g: 4,
      confidence: 0.91,
    },
    { error: 'not_food' },
  ])('returns a validated model result unchanged: %p', async (result) => {
    mockRun.mockResolvedValue({ finalOutput: JSON.stringify(result) });

    const response = await POST(request({ image }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(result);
  });

  it.each([
    {
      expected: {
        food: 'Greek yogurt',
        calories: 180,
        protein_g: 20,
        carbs_g: 16,
        fat_g: 4,
        confidence: 0.91,
      },
      finalOutput: {
        food: 'Greek yogurt',
        calories: 180,
        protein_g: 20,
        carbs_g: 16,
        fat_g: 4,
        confidence: 0.91,
        error: null,
      },
    },
    {
      expected: { error: 'not_food' },
      finalOutput: {
        food: null,
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        confidence: null,
        error: 'not_food',
      },
    },
  ])('normalizes structured sdk output: $expected', async ({ expected, finalOutput }) => {
    mockRun.mockResolvedValue({ finalOutput });

    const response = await POST(request({ image }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(expected);
  });

  it.each([
    undefined,
    'not json',
    '{"food":"Soup","calories":-1,"protein_g":2,"carbs_g":3,"fat_g":1,"confidence":0.8}',
    '{"error":"unexpected"}',
  ])('maps invalid model output to a safe response: %p', async (finalOutput) => {
    mockRun.mockResolvedValue({ finalOutput });

    const response = await POST(request({ image }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'analysis_failed' });
  });

  it('maps provider rejection to a safe response', async () => {
    mockRun.mockRejectedValue(new Error('provider rejected request'));

    const response = await POST(request({ image }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'analysis_failed' });
  });
});
