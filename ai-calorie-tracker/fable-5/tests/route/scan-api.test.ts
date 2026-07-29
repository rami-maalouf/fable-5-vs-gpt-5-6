/**
 * @jest-environment node
 */
// proves the post /scan handler follows the benchmark backend spec with the
// agents sdk fully mocked: exact agent config, image input, and safe responses.

jest.mock('@openai/agents', () => ({
  Agent: jest.fn(),
  run: jest.fn(),
  setTracingDisabled: jest.fn(),
}));

import { Agent, run, setTracingDisabled } from '@openai/agents';

import { MACROLENS_INSTRUCTIONS, POST } from '../../src/app/scan+api';

const mockAgent = Agent as unknown as jest.Mock;
const mockRun = run as unknown as jest.Mock;
const mockSetTracingDisabled = setTracingDisabled as unknown as jest.Mock;

const VERBATIM_INSTRUCTIONS =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';

const VALID_IMAGE = Buffer.from('fake jpeg bytes').toString('base64');

function scanRequest(body: unknown): Request {
  return new Request('http://localhost/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function modelResolves(finalOutput: unknown) {
  mockRun.mockResolvedValueOnce({ finalOutput });
}

const SALMON = {
  food: 'Grilled salmon with rice',
  calories: 540,
  protein_g: 38.5,
  carbs_g: 42,
  fat_g: 22.5,
  confidence: 0.87,
};

beforeEach(() => {
  mockRun.mockReset();
  mockAgent.mockReset();
});

describe('request validation', () => {
  it.each([
    ['missing image', {}],
    ['empty image', { image: '' }],
    ['non-string image', { image: 42 }],
    ['data-url prefix', { image: `data:image/jpeg;base64,${VALID_IMAGE}` }],
    ['non-base64 characters', { image: 'not base64!!' }],
    ['null body', null],
  ])('rejects %s with 400 and no model call', async (_label, body) => {
    const response = await POST(scanRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('rejects a non-json body with 400 and no model call', async () => {
    const response = await POST(scanRequest('not json at all'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('rejects an unreasonably large image with 400 and no model call', async () => {
    const oversized = 'A'.repeat(8_000_001);
    const response = await POST(scanRequest({ image: oversized }));
    expect(response.status).toBe(400);
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('agent configuration', () => {
  it('disables sdk tracing at module load', () => {
    expect(mockSetTracingDisabled).toHaveBeenCalledWith(true);
  });

  it('creates MacroLens exactly as the prompt requires', async () => {
    modelResolves(JSON.stringify(SALMON));
    await POST(scanRequest({ image: VALID_IMAGE }));

    expect(mockAgent).toHaveBeenCalledTimes(1);
    expect(mockAgent).toHaveBeenCalledWith({
      name: 'MacroLens',
      model: 'gpt-5.6-luna',
      instructions: VERBATIM_INSTRUCTIONS,
      outputType: expect.anything(),
    });
    expect(MACROLENS_INSTRUCTIONS).toBe(VERBATIM_INSTRUCTIONS);
  });

  it('sends one user message with one text part and one jpeg image part', async () => {
    modelResolves(JSON.stringify(SALMON));
    await POST(scanRequest({ image: VALID_IMAGE }));

    expect(mockRun).toHaveBeenCalledTimes(1);
    const [agentInstance, input] = mockRun.mock.calls[0];
    expect(agentInstance).toBe(mockAgent.mock.instances[0]);
    expect(input).toHaveLength(1);
    expect(input[0].role).toBe('user');
    const parts = input[0].content;
    expect(parts).toHaveLength(2);
    expect(parts[0].type).toBe('input_text');
    expect(parts[1]).toEqual({
      type: 'input_image',
      image: `data:image/jpeg;base64,${VALID_IMAGE}`,
    });
  });
});

describe('responses', () => {
  it('returns validated nutrition with 200 for a food result', async () => {
    modelResolves({ ...SALMON, error: null });
    const response = await POST(scanRequest({ image: VALID_IMAGE }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(SALMON);
  });

  it('returns not_food with 200 for a valid non-food result', async () => {
    modelResolves({
      food: null,
      calories: null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      confidence: null,
      error: 'not_food',
    });
    const response = await POST(scanRequest({ image: VALID_IMAGE }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ error: 'not_food' });
  });

  it.each([
    ['prose output', 'That looks like a salmon dish, roughly 540 kcal.'],
    ['negative calories', JSON.stringify({ ...SALMON, calories: -1 })],
    ['non-finite macros', JSON.stringify({ ...SALMON, fat_g: 'NaN' })],
    ['confidence above 1', JSON.stringify({ ...SALMON, confidence: 1.2 })],
    ['empty output', ''],
  ])('maps %s to a safe 502', async (_label, finalOutput) => {
    modelResolves(finalOutput);
    const response = await POST(scanRequest({ image: VALID_IMAGE }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'analysis_failed' });
  });

  it('maps a provider rejection to a safe 502 without leaking details', async () => {
    mockRun.mockRejectedValueOnce(
      new Error('provider exploded: secret sk-test-not-real'),
    );
    const response = await POST(scanRequest({ image: VALID_IMAGE }));
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).toBe(JSON.stringify({ error: 'analysis_failed' }));
    expect(text).not.toContain('secret');
  });
});
