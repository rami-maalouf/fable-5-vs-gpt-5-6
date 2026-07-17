import { z } from 'zod';

export const scanSuccessSchema = z
  .object({
    food: z.string().trim().min(1),
    calories: z.number().finite().nonnegative(),
    protein_g: z.number().finite().nonnegative(),
    carbs_g: z.number().finite().nonnegative(),
    fat_g: z.number().finite().nonnegative(),
    confidence: z.number().finite().min(0).max(1),
  })
  .strict();

export const scanNotFoodSchema = z.object({ error: z.literal('not_food') }).strict();
export const scanResultSchema = z.union([scanSuccessSchema, scanNotFoodSchema]);

export type ScanSuccess = z.infer<typeof scanSuccessSchema>;
export type ScanNotFood = z.infer<typeof scanNotFoodSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;

export function parseScanResult(value: unknown): ScanResult {
  return scanResultSchema.parse(value);
}
