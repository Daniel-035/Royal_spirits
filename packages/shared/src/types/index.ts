import type { z } from 'zod';
import {
  productSchema,
  createProductSchema,
  updateProductSchema,
  stockUpdateSchema,
  productQuerySchema,
  customerSchema,
  customerAddressSchema,
  saveAddressSchema,
  createOrderSchema,
  orderSchema,
  orderItemSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  orderListQuerySchema,
  adminLoginSchema,
  adminSchema,
  zoneSchema,
  createZoneSchema,
  updateZoneSchema,
  validatePincodeSchema,
  sendOtpSchema,
  verifyOtpSchema,
  customerSignupSchema,
  customerLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  adminRegisterSchema,
  updateAdminProfileSchema,
} from '../schemas/index.js';

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type StockUpdate = z.infer<typeof stockUpdateSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;

export type Customer = z.infer<typeof customerSchema>;
export type CustomerAddress = z.infer<typeof customerAddressSchema>;
export type SaveAddress = z.infer<typeof saveAddressSchema>;

export type CreateOrder = z.infer<typeof createOrderSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatus = z.infer<typeof updatePaymentStatusSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type Admin = z.infer<typeof adminSchema>;

export type Zone = z.infer<typeof zoneSchema>;
export type CreateZone = z.infer<typeof createZoneSchema>;
export type UpdateZone = z.infer<typeof updateZoneSchema>;
export type ValidatePincode = z.infer<typeof validatePincodeSchema>;

export type SendOtp = z.infer<typeof sendOtpSchema>;
export type VerifyOtp = z.infer<typeof verifyOtpSchema>;
export type CustomerSignup = z.infer<typeof customerSignupSchema>;
export type CustomerLogin = z.infer<typeof customerLoginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type AdminRegister = z.infer<typeof adminRegisterSchema>;
export type UpdateAdminProfile = z.infer<typeof updateAdminProfileSchema>;

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PincodeValidation {
  serviceable: boolean;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  withinHours?: boolean;
  message: string;
}
