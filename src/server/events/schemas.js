import { z } from 'zod';

export const listEventsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(16),
  genre: z.string().trim().min(1).max(50).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(['newest', 'date', 'price-asc', 'price-desc', 'popular']).default('newest'),
  days: z.coerce.number().int().min(1).max(60).optional(), // hanya event yang mulai dalam N hari ke depan
});
