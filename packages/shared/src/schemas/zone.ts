import { z } from 'zod';

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM 24h format');

export const zoneSchema = z.object({
  id: z.string().uuid(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  deliveryStartTime: timeStr,
  deliveryEndTime: timeStr,
  deliveryWindowMins: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createZoneSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  deliveryStartTime: timeStr,
  deliveryEndTime: timeStr,
  deliveryWindowMins: z.number().int().positive().max(600).default(90),
  isActive: z.boolean().default(true),
});

export const updateZoneSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  deliveryStartTime: timeStr.optional(),
  deliveryEndTime: timeStr.optional(),
  deliveryWindowMins: z.number().int().positive().max(600).optional(),
  isActive: z.boolean().optional(),
});

export const validatePincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
});
