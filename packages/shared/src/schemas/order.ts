import { z } from 'zod';
import { orderStatusSchema, orderSourceSchema, paymentTypeSchema, paymentStatusSchema, uuidSchema } from './product.js';

export const orderItemInputSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().positive().max(99),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
  deliveryAddress: z.string().min(5),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  ageConfirmed: z.literal(true),
  tncAccepted: z.literal(true),
  paymentType: paymentTypeSchema.default('Cash'),
  customerName: z.string().min(1).max(100).optional(),
});

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  itemName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  imageUrl: z.string().nullable().optional(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  phone: z.string(),
  source: orderSourceSchema,
  status: orderStatusSchema,
  paymentType: paymentTypeSchema,
  paymentStatus: paymentStatusSchema,
  deliveryAddress: z.string(),
  pincode: z.string(),
  subtotal: z.number().nonnegative(),
  deliveryCharge: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  ageConfirmed: z.boolean(),
  tncAccepted: z.boolean(),
  estimatedDeliveryAt: z.coerce.date().nullable().optional(),
  deliveredAt: z.coerce.date().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  items: z.array(orderItemSchema).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: paymentStatusSchema,
});

export const orderListQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentType: paymentTypeSchema.optional(),
  source: orderSourceSchema.optional(),
  date: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export const allowedStatusTransitions: Record<string, readonly string[]> = {
  Ordered: ['Processing', 'Cancelled'],
  Processing: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};
