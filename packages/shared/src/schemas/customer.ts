import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number');

export const customerSchema = z.object({
  id: z.string().uuid(),
  phone: phoneSchema,
  name: z.string().min(1).max(100).nullable(),
  createdAt: z.coerce.date(),
});

export const customerAddressSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  addressLine: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  isDefault: z.boolean(),
});

export const saveAddressSchema = z.object({
  addressLine: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  isDefault: z.boolean().optional(),
});
