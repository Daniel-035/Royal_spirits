import { env } from '../../config/env';
import crypto from 'node:crypto';

export interface WhatsAppMessageResult {
  messageId: string;
}

export interface WhatsAppService {
  sendText(to: string, body: string): Promise<WhatsAppMessageResult>;
  sendInteractive(to: string, payload: unknown): Promise<WhatsAppMessageResult>;
  sendTemplate(
    to: string,
    templateName: string,
    lang: string,
    params: string[],
  ): Promise<WhatsAppMessageResult>;
  verifyWebhookSignature(signature: string, rawBody: Buffer): boolean;
}

class MockWhatsAppService implements WhatsAppService {
  async sendText(to: string, body: string): Promise<WhatsAppMessageResult> {
    console.log(`[MOCK WHATSAPP] → to=${to} body=${body}`);
    return { messageId: `mock_${Date.now()}` };
  }

  async sendInteractive(to: string, payload: unknown): Promise<WhatsAppMessageResult> {
    console.log(`[MOCK WHATSAPP] → to=${to} interactive=${JSON.stringify(payload)}`);
    return { messageId: `mock_${Date.now()}` };
  }

  async sendTemplate(
    to: string,
    templateName: string,
    lang: string,
    params: string[],
  ): Promise<WhatsAppMessageResult> {
    console.log(
      `[MOCK WHATSAPP] → to=${to} template=${templateName} lang=${lang} params=${JSON.stringify(params)}`,
    );
    return { messageId: `mock_${Date.now()}` };
  }

  verifyWebhookSignature(_signature: string, _rawBody: Buffer): boolean {
    return true;
  }
}

class CloudApiWhatsAppService implements WhatsAppService {
  private get baseUrl(): string {
    return `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async sendText(to: string, body: string): Promise<WhatsAppMessageResult> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) {
      throw new Error(`WhatsApp sendText failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { messages: { id: string }[] };
    return { messageId: json.messages?.[0]?.id ?? '' };
  }

  async sendInteractive(to: string, payload: unknown): Promise<WhatsAppMessageResult> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: payload,
      }),
    });
    if (!res.ok) {
      throw new Error(`WhatsApp sendInteractive failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { messages: { id: string }[] };
    return { messageId: json.messages?.[0]?.id ?? '' };
  }

  async sendTemplate(
    to: string,
    templateName: string,
    lang: string,
    params: string[],
  ): Promise<WhatsAppMessageResult> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: lang },
          components: params.length
            ? [
                {
                  type: 'body',
                  parameters: params.map((p) => ({ type: 'text', text: p })),
                },
              ]
            : [],
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`WhatsApp sendTemplate failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { messages: { id: string }[] };
    return { messageId: json.messages?.[0]?.id ?? '' };
  }

  verifyWebhookSignature(signature: string, rawBody: Buffer): boolean {
    if (!env.whatsappAppSecret) return false;
    const expected = crypto
      .createHmac('sha256', env.whatsappAppSecret)
      .update(rawBody)
      .digest('hex');
    return signature === `sha256=${expected}`;
  }
}

export function createWhatsAppService(): WhatsAppService {
  switch (env.whatsappProvider) {
    case 'cloud_api':
      return new CloudApiWhatsAppService();
    case 'mock':
    default:
      return new MockWhatsAppService();
  }
}

export const whatsappService = createWhatsAppService();
