import { z } from 'zod';

export const systemAnalyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
});
