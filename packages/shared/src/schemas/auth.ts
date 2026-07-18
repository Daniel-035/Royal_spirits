import { z } from 'zod';
import { phoneSchema } from './customer.js';

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{4,6}$/, 'Invalid code'),
  name: z.string().min(1).max(100).optional(),
});
