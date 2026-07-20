import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { otpService } from '../services/otp';
import { signCustomerToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { unauthorized, badRequest } from '../utils/errors';
import { sendOtpSchema, verifyOtpSchema, customerSignupSchema, customerLoginSchema } from '@royal-spirits/shared';

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

customerAuthRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phone, name } = customerSignupSchema.parse(req.body);
    const existingEmail = await prisma.customer.findUnique({ where: { email } });
    if (existingEmail) {
      return next(badRequest('Email is already registered.'));
    }
    const existingPhone = await prisma.customer.findUnique({ where: { phone } });
    if (existingPhone && existingPhone.email) {
      return next(badRequest('Phone number is already registered.'));
    }
    const passwordHash = await bcrypt.hash(password, 10);
    let customer;
    if (existingPhone) {
      customer = await prisma.customer.update({
        where: { id: existingPhone.id },
        data: { email, passwordHash, name },
      });
    } else {
      customer = await prisma.customer.create({
        data: { email, passwordHash, phone, name },
      });
    }
    const token = signCustomerToken({ sub: customer.id, phone: customer.phone });
    setAuthCookie(res, env.customerCookieName, token);
    res.status(201).json({ id: customer.id, email: customer.email, phone: customer.phone, name: customer.name });
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = customerLoginSchema.parse(req.body);
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.passwordHash) {
      return next(unauthorized('Invalid email or password.'));
    }
    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      return next(unauthorized('Invalid email or password.'));
    }
    const token = signCustomerToken({ sub: customer.id, phone: customer.phone });
    setAuthCookie(res, env.customerCookieName, token);
    res.json({ id: customer.id, email: customer.email, phone: customer.phone, name: customer.name });
  } catch (err) {
    next(err);
  }
});

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
    res.json({ id: customer.id, email: customer.email, phone: customer.phone, name: customer.name });
  } catch (err) {
    next(err);
  }
});
