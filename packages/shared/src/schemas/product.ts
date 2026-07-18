import { z } from 'zod';
import { CATEGORIES, PAYMENT_TYPES, PAYMENT_STATUSES, ORDER_STATUSES } from '../constants.js';

export const uuidSchema = z.string().uuid();

export const productSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(150),
  category: z.enum(CATEGORIES),
  brand: z.string().min(1).max(100),
  volumeMl: z.number().int().positive(),
  price: z.number().positive(),
  stockQty: z.number().int().min(0),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.enum(CATEGORIES),
  brand: z.string().min(1).max(100),
  volumeMl: z.number().int().positive(),
  price: z.number().positive(),
  stockQty: z.number().int().min(0).default(0),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const stockUpdateSchema = z.object({
  stockQty: z.number().int().min(0),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentTypeSchema = z.enum(PAYMENT_TYPES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
