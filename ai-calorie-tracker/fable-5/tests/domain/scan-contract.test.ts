import {
  isNotFood,
  MAX_IMAGE_BASE64_LENGTH,
  parseModelOutput,
  parseScanRequest,
  parseScanResponse,
} from '../../src/domain/scan-contract';

const VALID = {
  food: 'Avocado toast',
  calories: 320,
  protein_g: 9.5,
  carbs_g: 30,
  fat_g: 18,
  confidence: 0.92,
};

describe('parseScanRequest', () => {
  it('accepts raw base64', () => {
    expect(parseScanRequest({ image: 'aGVsbG8=' })).toEqual({
      image: 'aGVsbG8=',
    });
  });

  it.each([
    ['null', null],
    ['array', []],
    ['missing image', {}],
    ['empty image', { image: '' }],
    ['number image', { image: 7 }],
    ['data-url prefix', { image: 'data:image/jpeg;base64,aGVsbG8=' }],
    ['whitespace', { image: 'aGVs bG8=' }],
  ])('rejects %s', (_label, body) => {
    expect(parseScanRequest(body)).toBeNull();
  });

  it('rejects an image above the size limit', () => {
    expect(
      parseScanRequest({ image: 'A'.repeat(MAX_IMAGE_BASE64_LENGTH + 1) }),
    ).toBeNull();
  });
});

describe('parseScanResponse', () => {
  it('round-trips a valid food result', () => {
    expect(parseScanResponse(VALID)).toEqual(VALID);
  });

  it('recognizes not_food', () => {
    const parsed = parseScanResponse({ error: 'not_food' });
    expect(parsed).toEqual({ error: 'not_food' });
    expect(parsed !== null && isNotFood(parsed)).toBe(true);
  });

  it.each([
    ['negative calories', { ...VALID, calories: -1 }],
    ['negative macros', { ...VALID, protein_g: -0.1 }],
    ['NaN calories', { ...VALID, calories: Number.NaN }],
    ['infinite fat', { ...VALID, fat_g: Number.POSITIVE_INFINITY }],
    ['string calories', { ...VALID, calories: '320' }],
    ['confidence above 1', { ...VALID, confidence: 1.01 }],
    ['negative confidence', { ...VALID, confidence: -0.2 }],
    ['empty food name', { ...VALID, food: '  ' }],
    ['missing macro', { food: 'x', calories: 1, protein_g: 1, carbs_g: 1 }],
    ['unknown error code', { error: 'oops' }],
    ['null', null],
    ['string', 'not an object'],
  ])('rejects %s', (_label, value) => {
    expect(parseScanResponse(value)).toBeNull();
  });
});

describe('parseModelOutput', () => {
  it('parses strict json', () => {
    expect(parseModelOutput(JSON.stringify(VALID))).toEqual(VALID);
  });

  it('tolerates a fenced code block', () => {
    expect(
      parseModelOutput('```json\n' + JSON.stringify(VALID) + '\n```'),
    ).toEqual(VALID);
  });

  it.each([
    ['prose', 'This looks like avocado toast, about 320 kcal'],
    ['empty', ''],
    ['broken json', '{"food": "toast", "calories":'],
  ])('rejects %s', (_label, text) => {
    expect(parseModelOutput(text)).toBeNull();
  });
});
