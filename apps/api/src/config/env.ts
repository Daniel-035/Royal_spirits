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
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  otpProvider: (process.env.OTP_PROVIDER ?? 'mock') as 'mock' | 'msg91' | 'twilio',
  otpTwilioAccountSid: process.env.OTP_TWILIO_ACCOUNT_SID ?? '',
  otpTwilioAuthToken: process.env.OTP_TWILIO_AUTH_TOKEN ?? '',
  otpTwilioFrom: process.env.OTP_TWILIO_FROM ?? '',
  otpMsg91AuthKey: process.env.OTP_MSG91_AUTH_KEY ?? '',
  otpMsg91SenderId: process.env.OTP_MSG91_SENDER_ID ?? 'RSPIRT',
  otpMsg91TemplateId: process.env.OTP_MSG91_TEMPLATE_ID ?? '',
  imageProvider: (process.env.IMAGE_PROVIDER ?? 'local') as 'local' | 'cloudinary',
  imageUploadDir: process.env.IMAGE_UPLOAD_DIR ?? 'uploads',
  imagePublicBase: process.env.IMAGE_PUBLIC_BASE ?? '/uploads',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  whatsappProvider: (process.env.WHATSAPP_PROVIDER ?? 'mock') as 'mock' | 'cloud_api',
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
  whatsappBusinessId: process.env.WHATSAPP_BUSINESS_ID ?? '',
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? 'v18.0',
};
