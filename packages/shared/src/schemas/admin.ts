import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});

export const adminSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(50),
  createdAt: z.coerce.date(),
});
