import { DEFAULT_MODEL, MODEL_ALLOWLIST, isAllowedModel } from '@/domain/models';

describe('model allowlist', () => {
  it('contains exactly the three spec models', () => {
    expect(MODEL_ALLOWLIST).toEqual(['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra']);
  });

  it('defaults to gpt-5.6-luna', () => {
    expect(DEFAULT_MODEL).toBe('gpt-5.6-luna');
  });

  it('accepts every allowlisted model', () => {
    for (const model of MODEL_ALLOWLIST) {
      expect(isAllowedModel(model)).toBe(true);
    }
  });

  it('rejects anything off the list', () => {
    expect(isAllowedModel('gpt-4o')).toBe(false);
    expect(isAllowedModel('')).toBe(false);
    expect(isAllowedModel('GPT-5.6-LUNA')).toBe(false);
    expect(isAllowedModel(undefined)).toBe(false);
    expect(isAllowedModel(42)).toBe(false);
  });
});
