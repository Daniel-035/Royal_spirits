import { env } from '../../config/env';

export interface NotificationService {
  sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void>;
  sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void>;
}

class MockNotificationService implements NotificationService {
  async sendOrderConfirmation(phone: string, orderId: string, total: number): Promise<void> {
    console.log(
      `[MOCK NOTIFICATION] Order confirmation → phone=${phone} orderId=${orderId} total=₹${total}`,
    );
  }

  async sendStatusUpdate(phone: string, orderId: string, status: string): Promise<void> {
    console.log(
      `[MOCK NOTIFICATION] Status update → phone=${phone} orderId=${orderId} status=${status}`,
    );
  }
}

class Msg91NotificationService implements NotificationService {
  async sendOrderConfirmation(): Promise<void> {
    throw new Error('MSG91 notification provider not configured');
  }
  async sendStatusUpdate(): Promise<void> {
    throw new Error('MSG91 notification provider not configured');
  }
}

class TwilioNotificationService implements NotificationService {
  async sendOrderConfirmation(): Promise<void> {
    throw new Error('Twilio notification provider not configured');
  }
  async sendStatusUpdate(): Promise<void> {
    throw new Error('Twilio notification provider not configured');
  }
}

export function createNotificationService(): NotificationService {
  switch (env.otpProvider) {
    case 'msg91':
      return new Msg91NotificationService();
    case 'twilio':
      return new TwilioNotificationService();
    case 'mock':
    default:
      return new MockNotificationService();
  }
}

export const notificationService = createNotificationService();
