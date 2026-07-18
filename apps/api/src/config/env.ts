import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminCookieName: process.env.ADMIN_COOKIE_NAME ?? 'rs_admin',
  customerCookieName: process.env.CUSTOMER_COOKIE_NAME ?? 'rs_cust',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  exciseLicenseNumber: process.env.EXCISE_LICENSE_NUMBER ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  otpProvider: (process.env.OTP_PROVIDER ?? 'mock') as 'mock' | 'msg91' | 'twilio',
  imageProvider: (process.env.IMAGE_PROVIDER ?? 'local') as 'local' | 'cloudinary',
  imageUploadDir: process.env.IMAGE_UPLOAD_DIR ?? 'uploads',
  imagePublicBase: process.env.IMAGE_PUBLIC_BASE ?? '/uploads',
};
