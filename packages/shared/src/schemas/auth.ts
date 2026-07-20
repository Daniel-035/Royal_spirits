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

export const customerSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: phoneSchema,
  name: z.string().min(1, 'Name is required').max(100),
});

export const customerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
