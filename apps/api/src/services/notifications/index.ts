import { env } from '../../config/env';
import Twilio from 'twilio';

export interface NotificationService {
  sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void>;
  sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void>;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return digits.startsWith('+') ? digits : `+${digits}`;
}

class MockNotificationService implements NotificationService {
  async sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void> {
    console.log(
      `[MOCK NOTIFICATION] Order confirmation -> phone=${phone} orderId=${orderId} total=Rs${total}`,
    );
  }

  async sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void> {
    console.log(
      `[MOCK NOTIFICATION] Status update -> phone=${phone} orderId=${orderId} status=${status}`,
    );
  }
}

class TwilioNotificationService implements NotificationService {
  private client: Twilio.Twilio;

  constructor() {
    if (!env.otpTwilioAccountSid || !env.otpTwilioAuthToken) {
      throw new Error('Twilio credentials not configured for notifications');
    }
    this.client = new Twilio.Twilio(env.otpTwilioAccountSid, env.otpTwilioAuthToken);
  }

  async sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void> {
    await this.client.messages.create({
      body: `Royal Spirits: Your order #${orderId.slice(0, 8)} has been placed. Total: Rs ${total}. We will notify you when it is confirmed.`,
      to: toE164(phone),
      from: env.otpTwilioFrom,
    });
  }

  async sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void> {
    const messages: Record<string, string> = {
      Processing: `Royal Spirits: Your order #${orderId.slice(0, 8)} is now being processed. We will notify you when it is out for delivery.`,
      Delivered: `Royal Spirits: Your order #${orderId.slice(0, 8)} has been delivered. Thank you for shopping with us!`,
      Cancelled: `Royal Spirits: Your order #${orderId.slice(0, 8)} has been cancelled. For queries, contact support.`,
    };
    const body = messages[status] ?? `Royal Spirits: Your order #${orderId.slice(0, 8)} status is now: ${status}.`;
    await this.client.messages.create({
      body,
      to: toE164(phone),
      from: env.otpTwilioFrom,
    });
  }
}

class Msg91NotificationService implements NotificationService {
  constructor() {
    if (!env.otpMsg91AuthKey) {
      throw new Error('MSG91 credentials not configured for notifications');
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const url = `https://api.msg91.com/api/v5/flow`;
    const payload = {
      template_id: env.otpMsg91TemplateId || 'royal_spirits_notification',
      sender: env.otpMsg91SenderId,
      short_url: '0',
      mobiles: toE164(phone).slice(1),
      var: message,
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
      throw new Error(`MSG91 SMS send failed: ${res.status} ${await res.text()}`);
    }
  }

  async sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void> {
    await this.sendSms(
      phone,
      `Royal Spirits: Order #${orderId.slice(0, 8)} placed. Total: Rs ${total}.`,
    );
  }

  async sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void> {
    await this.sendSms(
      phone,
      `Royal Spirits: Order #${orderId.slice(0, 8)} status: ${status}.`,
    );
  }
}

export function createNotificationService(): NotificationService {
  switch (env.otpProvider) {
    case 'twilio':
      return new TwilioNotificationService();
    case 'msg91':
      return new Msg91NotificationService();
    case 'mock':
    default:
      return new MockNotificationService();
  }
}

export const notificationService = createNotificationService();
