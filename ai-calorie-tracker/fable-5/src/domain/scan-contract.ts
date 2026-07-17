// shared request/response contract for post /scan. pure typescript: no react,
// expo, or server imports, so both the api route and the client validate the
// same shapes at their own boundary.

export type ScanRequest = {
  // raw base64 for a jpeg, with no data-url prefix
  image: string;
};

export type ScanSuccess = {
  food: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};

export type ScanNotFood = { error: 'not_food' };

export type ScanResponse = ScanSuccess | ScanNotFood;

export type ScanErrorCode = 'invalid_request' | 'analysis_failed';

// a prepared 1024 px jpeg at 0.82 quality stays well under 1 mb of base64;
// anything near this limit skipped client-side preparation.
export const MAX_IMAGE_BASE64_LENGTH = 8_000_000;

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export function parseScanRequest(body: unknown): ScanRequest | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const image = (body as Record<string, unknown>).image;
  if (typeof image !== 'string' || image.length === 0) {
    return null;
  }
  if (image.length > MAX_IMAGE_BASE64_LENGTH) {
    return null;
  }
  if (!BASE64_PATTERN.test(image)) {
    return null;
  }
  return { image };
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isNotFood(value: ScanResponse): value is ScanNotFood {
  return 'error' in value;
}

// validates an already-parsed json value against the response contract.
// returns null for anything malformed, negative, non-finite, or out of range.
export function parseScanResponse(value: unknown): ScanResponse | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;

  if (record.error === 'not_food') {
    return { error: 'not_food' };
  }

  if (typeof record.food !== 'string' || record.food.trim().length === 0) {
    return null;
  }
  if (
    !isFiniteNonNegative(record.calories) ||
    !isFiniteNonNegative(record.protein_g) ||
    !isFiniteNonNegative(record.carbs_g) ||
    !isFiniteNonNegative(record.fat_g)
  ) {
    return null;
  }
  if (!isFiniteNonNegative(record.confidence) || record.confidence > 1) {
    return null;
  }

  return {
    food: record.food,
    calories: record.calories,
    protein_g: record.protein_g,
    carbs_g: record.carbs_g,
    fat_g: record.fat_g,
    confidence: record.confidence,
  };
}

// parses the model's final text output. tolerates a fenced code block but
// otherwise requires strict json per the agent instructions.
export function parseModelOutput(text: string): ScanResponse | null {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return parseScanResponse(JSON.parse(trimmed));
  } catch {
    return null;
  }
}
