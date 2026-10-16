import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional().or(z.literal('')),
});

export const env = envSchema.parse(import.meta.env);
