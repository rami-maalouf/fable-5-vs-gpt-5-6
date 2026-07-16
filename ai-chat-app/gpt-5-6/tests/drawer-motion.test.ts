/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import {
  clampDrawerProgress,
  resolveDrawerTarget,
} from '@/components/drawer/drawer-motion';

describe('drawer motion', () => {
  test('clamps interactive progress to the closed and open positions', () => {
    expect(clampDrawerProgress(-0.2)).toBe(0);
    expect(clampDrawerProgress(0.45)).toBe(0.45);
    expect(clampDrawerProgress(1.2)).toBe(1);
  });

  test('settles by velocity before falling back to the halfway threshold', () => {
    expect(resolveDrawerTarget(0.2, 700)).toBe(1);
    expect(resolveDrawerTarget(0.8, -700)).toBe(0);
    expect(resolveDrawerTarget(0.49, 0)).toBe(0);
    expect(resolveDrawerTarget(0.5, 0)).toBe(1);
  });
});
