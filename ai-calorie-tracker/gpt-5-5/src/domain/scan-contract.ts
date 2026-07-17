export const MACROLENS_NAME = "MacroLens";
export const MACROLENS_MODEL = "gpt-5.6-luna";
export const MACROLENS_INSTRUCTIONS =
  'You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.';
export const MAX_SCAN_IMAGE_BASE64_LENGTH = 8_000_000;

export type ScanSuccess = {
  food: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};

export type ScanNotFood = {
  error: "not_food";
};

export type ScanResponse = ScanSuccess | ScanNotFood;

type ScanRequestParseResult =
  | {
      ok: true;
      image: string;
    }
  | {
      ok: false;
    };

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

export function parseScanRequestBody(body: unknown): ScanRequestParseResult {
  if (!isRecord(body)) {
    return { ok: false };
  }

  const image = body.image;

  if (typeof image !== "string") {
    return { ok: false };
  }

  const trimmedImage = image.trim();

  if (
    trimmedImage.length === 0 ||
    trimmedImage.length > MAX_SCAN_IMAGE_BASE64_LENGTH ||
    trimmedImage.startsWith("data:") ||
    trimmedImage.length % 4 === 1 ||
    !base64Pattern.test(trimmedImage)
  ) {
    return { ok: false };
  }

  return { ok: true, image: trimmedImage };
}

export function parseScanModelOutput(output: unknown): ScanResponse | null {
  const parsed = parseJsonOutput(output);

  if (!isRecord(parsed)) {
    return null;
  }

  if (parsed.error === "not_food") {
    return { error: "not_food" };
  }

  if (
    typeof parsed.food !== "string" ||
    parsed.food.trim().length === 0 ||
    !isNonNegativeFiniteNumber(parsed.calories) ||
    !isNonNegativeFiniteNumber(parsed.protein_g) ||
    !isNonNegativeFiniteNumber(parsed.carbs_g) ||
    !isNonNegativeFiniteNumber(parsed.fat_g) ||
    !isConfidence(parsed.confidence)
  ) {
    return null;
  }

  return {
    food: parsed.food.trim(),
    calories: parsed.calories,
    protein_g: parsed.protein_g,
    carbs_g: parsed.carbs_g,
    fat_g: parsed.fat_g,
    confidence: parsed.confidence,
  };
}

function parseJsonOutput(output: unknown): unknown {
  if (typeof output !== "string") {
    return output;
  }

  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isConfidence(value: unknown): value is number {
  return isNonNegativeFiniteNumber(value) && value <= 1;
}
