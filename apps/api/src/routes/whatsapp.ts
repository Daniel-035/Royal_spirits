import { Router } from 'express';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { whatsappService } from '../services/whatsapp';
import { handleInbound, type InboundMessage } from '../services/whatsapp/intents';

export const whatsappRouter = Router();

whatsappRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.whatsappVerifyToken) {
    return res.status(200).send(challenge as string);
  }
  return res.sendStatus(403);
});

whatsappRouter.post('/webhook', (req: Request, res: Response) => {
  const signature = req.get('X-Hub-Signature-256') ?? '';
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (env.whatsappProvider === 'cloud_api') {
    if (!rawBody || !whatsappService.verifyWebhookSignature(signature, rawBody)) {
      res.sendStatus(401);
      return;
    }
  }

  const body = req.body as WhatsAppWebhookPayload;

  if (body.object !== 'whatsapp_business_account') {
    res.sendStatus(404);
    return;
  }

  res.sendStatus(200);

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const messages = change.value?.messages ?? [];
      for (const msg of messages) {
        processMessage(msg).catch((e) =>
          console.error('[whatsapp] message handling failed:', e),
        );
      }
    }
  }
});

async function processMessage(msg: WhatsAppMessage): Promise<void> {
  const waMessageId = msg.id;
  const fromPhone = msg.from;

  const existing = await prisma.whatsAppEventLog.findUnique({
    where: { waMessageId },
  });
  if (existing) {
    return;
  }

  let inbound: InboundMessage;
  if (msg.type === 'text') {
    inbound = {
      from: fromPhone,
      type: 'text',
      text: msg.text?.body ?? '',
    };
  } else if (msg.type === 'interactive') {
    const id = msg.interactive?.list_reply?.id ?? msg.interactive?.button_reply?.id;
    inbound = {
      from: fromPhone,
      type: 'interactive',
      interactiveId: id ?? '',
    };
  } else {
    inbound = {
      from: fromPhone,
      type: 'unsupported',
    };
  }

  await prisma.whatsAppEventLog.create({
    data: {
      waMessageId,
      fromPhone,
      direction: 'in',
      type: msg.type,
      payloadJson: JSON.stringify(msg),
    },
  });

  await handleInbound(inbound);
}

interface WhatsAppMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    list_reply?: { id: string };
    button_reply?: { id: string };
  };
}

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: {
    id: string;
    changes: {
      value: {
        messaging_product?: string;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }[];
  }[];
}
