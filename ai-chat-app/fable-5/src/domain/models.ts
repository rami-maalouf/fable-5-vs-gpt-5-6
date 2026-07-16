export const MODEL_ALLOWLIST = ['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'] as const;

export type ModelId = (typeof MODEL_ALLOWLIST)[number];

export const DEFAULT_MODEL: ModelId = 'gpt-5.6-luna';

export function isAllowedModel(value: unknown): value is ModelId {
  return typeof value === 'string' && (MODEL_ALLOWLIST as readonly string[]).includes(value);
}
