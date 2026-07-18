import { env } from '../../config/env';
import crypto from 'node:crypto';
import { OTP_LENGTH, OTP_TTL_MINUTES } from '@royal-spirits/shared';

export interface OtpService {
  send(phone: string): Promise<{ code: string; expiresAt: Date }>;
}

class MockOtpService implements OtpService {
  async send(phone: string): Promise<{ code: string; expiresAt: Date }> {
    const code = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    console.log(`[MOCK OTP] phone=${phone} code=${code} expiresAt=${expiresAt.toISOString()}`);
    return { code, expiresAt };
  }
}

class Msg91OtpService implements OtpService {
  async send(): Promise<{ code: string; expiresAt: Date }> {
    throw new Error('MSG91 OTP provider not configured');
  }
}

class TwilioOtpService implements OtpService {
  async send(): Promise<{ code: string; expiresAt: Date }> {
    throw new Error('Twilio OTP provider not configured');
  }
}

export function createOtpService(): OtpService {
  switch (env.otpProvider) {
    case 'msg91':
      return new Msg91OtpService();
    case 'twilio':
      return new TwilioOtpService();
    case 'mock':
    default:
      return new MockOtpService();
  }
}

export const otpService = createOtpService();
