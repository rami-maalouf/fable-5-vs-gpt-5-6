import type { Meal } from '@/domain/nutrition';

export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export function createDemoMeals(now = Date.now()): Meal[] {
  return [
    {
      id: 'demo-meal-salmon-bowl',
      food: 'Miso salmon rice bowl',
      calories: 642,
      protein_g: 42,
      carbs_g: 71,
      fat_g: 21,
      confidence: 0.97,
      thumbnailUri: 'demo://salmon-bowl',
      loggedAt: now - 45 * 60 * 1000,
    },
  ];
}

export const demoScanResult = {
  food: 'Miso salmon rice bowl',
  calories: 642,
  protein_g: 42,
  carbs_g: 71,
  fat_g: 21,
  confidence: 0.97,
} as const;
