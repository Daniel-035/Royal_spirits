import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { requireAdmin } from '../middleware/requireAdmin';
import { whatsappService } from '../services/whatsapp';
import { badRequest, notFound } from '../utils/errors';
import { z } from 'zod';

export const adminWhatsappRouter = Router();

adminWhatsappRouter.use(requireAdmin);

adminWhatsappRouter.get(
  '/conversations',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 50)));

      const rows = await prisma.whatsAppEventLog.groupBy({
        by: ['fromPhone'],
        _max: { createdAt: true },
        _count: { _all: true },
        orderBy: { _max: { createdAt: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const phones = rows.map((r) => r.fromPhone);
      const sessions = await prisma.whatsAppSession.findMany({
        where: { phone: { in: phones } },
      });
      const sessionByPhone = new Map(sessions.map((s) => [s.phone, s]));

      const data = rows.map((r) => {
        const session = sessionByPhone.get(r.fromPhone);
        return {
          phone: r.fromPhone,
          lastMessageAt: r._max.createdAt,
          messageCount: r._count._all,
          handoffToAdminId: session?.handoffToAdminId ?? null,
          customerName: session?.customerName ?? null,
          state: session?.state ?? null,
        };
      });

      res.json({ data, page, pageSize });
    } catch (err) {
      next(err);
    }
  },
);

adminWhatsappRouter.get(
  '/conversations/:phone',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const phone = req.params.phone;
      const before = req.query.before ? new Date(String(req.query.before)) : undefined;
      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 100)));

      const where: Prisma.WhatsAppEventLogWhereInput = { fromPhone: phone };
      if (before) where.createdAt = { lt: before };

      const messages = await prisma.whatsAppEventLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const session = await prisma.whatsAppSession.findUnique({ where: { phone } });

      res.json({
        phone,
        session: session
          ? {
              state: session.state,
              customerName: session.customerName,
              handoffToAdminId: session.handoffToAdminId,
              cartJson: session.cartJson,
            }
          : null,
        messages: messages.reverse().map((m) => ({
          id: m.id,
          direction: m.direction,
          type: m.type,
          fromPhone: m.fromPhone,
          createdAt: m.createdAt,
          payload: m.payloadJson,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

const handoffSchema = z.object({
  enabled: z.boolean(),
});

adminWhatsappRouter.post(
  '/handoff/:phone',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enabled } = handoffSchema.parse(req.body);
      const phone = req.params.phone;

      const session = await prisma.whatsAppSession.findUnique({ where: { phone } });
      if (!session) {
        return next(notFound('Conversation not found'));
      }

      const updated = await prisma.whatsAppSession.update({
        where: { phone },
        data: {
          handoffToAdminId: enabled ? req.admin!.sub : null,
        },
      });

      res.json({
        phone: updated.phone,
        handoffToAdminId: updated.handoffToAdminId,
        enabled: updated.handoffToAdminId !== null,
      });
    } catch (err) {
      next(err);
    }
  },
);

const broadcastSchema = z.object({
  phones: z.array(z.string()).optional(),
  all: z.boolean().optional(),
  message: z.string().min(1).max(4096),
}).refine((d) => d.all || (d.phones && d.phones.length > 0), {
  message: 'Provide either "all: true" or a non-empty "phones" array',
});

adminWhatsappRouter.post(
  '/broadcast',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = broadcastSchema.parse(req.body);
      const message = parsed.message;

      let phones: string[];
      if (parsed.all) {
        const sessions = await prisma.whatsAppSession.findMany({
          select: { phone: true },
        });
        phones = sessions.map((s) => s.phone);
      } else {
        phones = parsed.phones ?? [];
      }

      if (phones.length > 100) {
        return next(badRequest('Broadcast is capped at 100 recipients per request'));
      }

      const results: { phone: string; ok: boolean; error?: string }[] = [];
      for (const phone of phones) {
        try {
          await whatsappService.sendText(phone, message);
          await prisma.whatsAppEventLog.create({
            data: {
              waMessageId: `broadcast_${Date.now()}_${phone}`,
              fromPhone: 'admin',
              direction: 'out',
              type: 'text',
              payloadJson: JSON.stringify({ message, sentBy: req.admin!.sub }),
            },
          });
          results.push({ phone, ok: true });
        } catch (err) {
          results.push({
            phone,
            ok: false,
            error: err instanceof Error ? err.message : 'send failed',
          });
        }
      }

      res.json({
        total: phones.length,
        sent: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      });
    } catch (err) {
      next(err);
    }
  },
);
