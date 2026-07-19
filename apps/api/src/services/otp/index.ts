import { env } from '../../config/env';
import crypto from 'node:crypto';
import Twilio from 'twilio';
import { OTP_LENGTH, OTP_TTL_MINUTES } from '@royal-spirits/shared';

export interface OtpService {
  send(phone: string): Promise<{ code: string; expiresAt: Date }>;
}

function generateOtp(): { code: string; expiresAt: Date } {
  const code = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  return { code, expiresAt };
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return digits.startsWith('+') ? digits : `+${digits}`;
}

class MockOtpService implements OtpService {
  async send(phone: string): Promise<{ code: string; expiresAt: Date }> {
    const otp = generateOtp();
    console.log(`[MOCK OTP] phone=${phone} code=${otp.code} expiresAt=${otp.expiresAt.toISOString()}`);
    return otp;
  }
}

class TwilioOtpService implements OtpService {
  private client: Twilio.Twilio;

  constructor() {
    if (!env.otpTwilioAccountSid || !env.otpTwilioAuthToken) {
      throw new Error('Twilio credentials not configured: OTP_TWILIO_ACCOUNT_SID and OTP_TWILIO_AUTH_TOKEN required');
    }
    this.client = new Twilio.Twilio(env.otpTwilioAccountSid, env.otpTwilioAuthToken);
  }

  async send(phone: string): Promise<{ code: string; expiresAt: Date }> {
    const otp = generateOtp();
    await this.client.messages.create({
      body: `${otp.code} is your Royal Spirits verification code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.`,
      to: toE164(phone),
      from: env.otpTwilioFrom,
    });
    return otp;
  }
}

class Msg91OtpService implements OtpService {
  constructor() {
    if (!env.otpMsg91AuthKey) {
      throw new Error('MSG91 credentials not configured: OTP_MSG91_AUTH_KEY required');
    }
  }

  async send(phone: string): Promise<{ code: string; expiresAt: Date }> {
    const otp = generateOtp();
    const url = `https://api.msg91.com/api/v5/flow`;
    const payload = {
      template_id: env.otpMsg91TemplateId || 'royal_spirits_otp',
      sender: env.otpMsg91SenderId,
      short_url: '0',
      mobiles: toE164(phone).slice(1),
      var: otp.code,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authkey: env.otpMsg91AuthKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`MSG91 OTP send failed: ${res.status} ${await res.text()}`);
    }
    return otp;
  }
}

export function createOtpService(): OtpService {
  switch (env.otpProvider) {
    case 'twilio':
      return new TwilioOtpService();
    case 'msg91':
      return new Msg91OtpService();
    case 'mock':
    default:
      return new MockOtpService();
  }
}

export const otpService = createOtpService();
