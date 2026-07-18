import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { otpService } from '../services/otp';
import { signCustomerToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { unauthorized, badRequest } from '../utils/errors';
import { sendOtpSchema, verifyOtpSchema } from '@royal-spirits/shared';

export const customerAuthRouter = Router();

customerAuthRouter.post('/otp/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    const { code, expiresAt } = await otpService.send(phone);
    await prisma.otpCode.create({
      data: { phone, code, expiresAt },
    });
    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.post(
  '/otp/verify',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code, name } = verifyOtpSchema.parse(req.body);
      const otp = await prisma.otpCode.findFirst({
        where: {
          phone,
          code,
          consumed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!otp) {
        return next(unauthorized('Invalid or expired OTP'));
      }
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumed: true },
      });
      const customer = await prisma.customer.upsert({
        where: { phone },
        update: name ? { name } : {},
        create: { phone, name: name ?? null },
      });
      const token = signCustomerToken({ sub: customer.id, phone: customer.phone });
      setAuthCookie(res, env.customerCookieName, token);
      res.json({ id: customer.id, phone: customer.phone, name: customer.name });
    } catch (err) {
      next(err);
    }
  },
);

customerAuthRouter.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res, env.customerCookieName);
  res.json({ ok: true });
});

customerAuthRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[env.customerCookieName];
    if (!token) {
      return next(badRequest('Not authenticated'));
    }
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);
    if (payload.role !== 'customer') {
      return next(unauthorized('Invalid session'));
    }
    const customer = await prisma.customer.findUnique({
      where: { id: payload.sub },
    });
    if (!customer) {
      return next(unauthorized('Customer not found'));
    }
    res.json({ id: customer.id, phone: customer.phone, name: customer.name });
  } catch (err) {
    next(err);
  }
});
