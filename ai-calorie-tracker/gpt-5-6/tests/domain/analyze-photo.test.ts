import { analyzePhoto, AnalyzePhotoError } from '../../src/services/analyze-photo';

const foodResult = {
  food: 'Fried chicken',
  calories: 988,
  protein_g: 54,
  carbs_g: 39,
  fat_g: 60,
  confidence: 0.99,
};

describe('analyzePhoto', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('posts raw jpeg base64 once and validates a food result', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(foodResult),
    });

    await expect(
      analyzePhoto('raw-jpeg-base64', controller.signal),
    ).resolves.toEqual(foodResult);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/scan', {
      body: JSON.stringify({ image: 'raw-jpeg-base64' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: controller.signal,
    });
  });

  it('returns a validated not-food result', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: 'not_food' }),
    });

    await expect(analyzePhoto('raw-jpeg-base64')).resolves.toEqual({
      error: 'not_food',
    });
  });

  it('classifies transport rejection as a network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(analyzePhoto('raw-jpeg-base64')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('classifies safe server and malformed response failures as analysis errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    await expect(analyzePhoto('raw-jpeg-base64')).rejects.toEqual(
      new AnalyzePhotoError('analysis'),
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ food: 'missing nutrition' }),
    });

    await expect(analyzePhoto('raw-jpeg-base64')).rejects.toMatchObject({
      kind: 'analysis',
    });
  });
});
