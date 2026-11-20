import { z } from 'zod';

export const listAttendeesSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  eventId: z.string().uuid('ID acara tidak valid.').optional(),
  status: z.enum(['checked_in', 'not_checked_in']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
