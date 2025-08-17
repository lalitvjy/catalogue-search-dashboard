import { z } from 'zod'
export const skuUpsertSchema = z.object({
  skuCode: z.string(),
  title: z.string().optional(),
  fileName: z.string(),
  imageUrl: z.string().url(),
  attrs: z.record(z.any()).optional(),
})
export const searchImageSchema = z.object({
  imageUrl: z.string().url(),
  topK: z.number().int().min(1).max(200).default(24),
  threshold: z.number().min(0).max(1).default(0.8),
  filters: z.object({
    type: z.string().optional(),
    category: z.string().optional(),
    occasion: z.string().optional(),
    diamond_wt_min: z.number().optional(),
    diamond_wt_max: z.number().optional(),
  }).optional(),
})
