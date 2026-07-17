// typed client behavior for post /scan with global fetch mocked: valid and
// invalid 200 bodies, safe server failures, transport failures, and abort.
import { analyzePhoto } from '../../src/services/analyze-photo';
import type { ScanSuccess } from '../../src/domain/scan-contract';

const VALID_RESULT: ScanSuccess = {
  food: 'Grilled chicken salad',
  calories: 420,
  protein_g: 38,
  carbs_g: 22,
  fat_g: 18,
  confidence: 0.9,
};

const IMAGE_BASE64 = 'cGl4ZWxz';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

it('posts the raw base64 to the relative /scan route as json', async () => {
  mockFetch.mockResolvedValue(jsonResponse(200, VALID_RESULT));

  await analyzePhoto(IMAGE_BASE64);

  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledWith('/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: IMAGE_BASE64 }),
    signal: undefined,
  });
});

it('returns a success outcome for a valid 200 food response', async () => {
  mockFetch.mockResolvedValue(jsonResponse(200, VALID_RESULT));

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'success', result: VALID_RESULT });
});

it('returns not_food for a valid 200 not-food response', async () => {
  mockFetch.mockResolvedValue(jsonResponse(200, { error: 'not_food' }));

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'not_food' });
});

it('treats a 200 body with an invalid shape as an analysis failure', async () => {
  mockFetch.mockResolvedValue(
    jsonResponse(200, { food: 'soup', calories: -3 }),
  );

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'failure', reason: 'analysis' });
});

it('treats a 200 body that is not json as an analysis failure', async () => {
  mockFetch.mockResolvedValue({
    status: 200,
    ok: true,
    json: () => Promise.reject(new SyntaxError('unexpected token')),
  } as unknown as Response);

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'failure', reason: 'analysis' });
});

it('maps a 502 to an analysis failure', async () => {
  mockFetch.mockResolvedValue(jsonResponse(502, { error: 'analysis_failed' }));

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'failure', reason: 'analysis' });
});

it('maps a 400 to an analysis failure', async () => {
  mockFetch.mockResolvedValue(jsonResponse(400, { error: 'invalid_request' }));

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'failure', reason: 'analysis' });
});

it('maps a thrown fetch to a network failure', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed'));

  const outcome = await analyzePhoto(IMAGE_BASE64);

  expect(outcome).toEqual({ kind: 'failure', reason: 'network' });
});

it('returns an aborted outcome when the signal is aborted', async () => {
  const controller = new AbortController();
  mockFetch.mockImplementation(() => {
    controller.abort();
    return Promise.reject(new Error('Aborted'));
  });

  const outcome = await analyzePhoto(IMAGE_BASE64, controller.signal);

  expect(outcome).toEqual({ kind: 'aborted' });
});

it('passes the abort signal through to fetch', async () => {
  const controller = new AbortController();
  mockFetch.mockResolvedValue(jsonResponse(200, VALID_RESULT));

  await analyzePhoto(IMAGE_BASE64, controller.signal);

  expect(mockFetch).toHaveBeenCalledWith(
    '/scan',
    expect.objectContaining({ signal: controller.signal }),
  );
});
