import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});

export const adminSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(50),
  businessName: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  shopAddress: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const adminRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  businessName: z.string().min(1, 'Business name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  shopAddress: z.string().min(1, 'Shop address is required'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(15),
});

export const updateAdminProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  shopAddress: z.string().min(1, 'Shop address is required'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(15),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
});
