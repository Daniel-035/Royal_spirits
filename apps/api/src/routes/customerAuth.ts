import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { otpService } from '../services/otp';
import { signCustomerToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { unauthorized, badRequest } from '../utils/errors';
import {
  sendOtpSchema,
  verifyOtpSchema,
  customerSignupSchema,
  customerLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  saveAddressSchema,
} from '@royal-spirits/shared';

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

customerAuthRouter.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[env.customerCookieName];
    if (!token) return next(unauthorized('Not authenticated'));
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);
    if (payload.role !== 'customer') return next(unauthorized('Invalid session'));
    const { name, email, phone, currentPassword, newPassword } = updateProfileSchema.parse(req.body);
    const customer = await prisma.customer.findUnique({ where: { id: payload.sub } });
    if (!customer) return next(unauthorized('Customer not found'));
    if (email !== customer.email) {
      const existingEmail = await prisma.customer.findUnique({ where: { email } });
      if (existingEmail) return next(badRequest('Email is already registered.'));
    }
    if (phone !== customer.phone) {
      const existingPhone = await prisma.customer.findUnique({ where: { phone } });
      if (existingPhone) return next(badRequest('Phone number is already registered.'));
    }
    let passwordHash = customer.passwordHash;
    if (newPassword) {
      if (!currentPassword || !customer.passwordHash) {
        return next(badRequest('Current password is required to set a new password.'));
      }
      const ok = await bcrypt.compare(currentPassword, customer.passwordHash);
      if (!ok) {
        return next(badRequest('Invalid current password.'));
      }
      passwordHash = await bcrypt.hash(newPassword, 10);
    }
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { name, email, phone, passwordHash },
    });
    res.json({ id: updated.id, email: updated.email, phone: updated.phone, name: updated.name });
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.get('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[env.customerCookieName];
    if (!token) return next(unauthorized('Not authenticated'));
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);
    if (payload.role !== 'customer') return next(unauthorized('Invalid session'));
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: payload.sub },
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.post('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[env.customerCookieName];
    if (!token) return next(unauthorized('Not authenticated'));
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);
    if (payload.role !== 'customer') return next(unauthorized('Invalid session'));
    const { addressLine, pincode, isDefault } = saveAddressSchema.parse(req.body);
    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: payload.sub },
        data: { isDefault: false },
      });
    }
    const newAddress = await prisma.customerAddress.create({
      data: {
        customerId: payload.sub,
        addressLine,
        pincode,
        isDefault: !!isDefault,
      },
    });
    res.status(201).json(newAddress);
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.delete('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[env.customerCookieName];
    if (!token) return next(unauthorized('Not authenticated'));
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);
    if (payload.role !== 'customer') return next(unauthorized('Invalid session'));
    const address = await prisma.customerAddress.findFirst({
      where: { id: req.params.id, customerId: payload.sub },
    });
    if (!address) {
      return next(badRequest('Address not found'));
    }
    await prisma.customerAddress.delete({
      where: { id: req.params.id },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      res.json({ message: 'If the email exists, a reset code has been sent.' });
      return;
    }
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordReset.create({
      data: { email, token, expiresAt },
    });
    console.log(`[MOCK PASSWORD RESET] email=${email} code=${token}`);
    res.json({ message: 'If the email exists, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
});

customerAuthRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, newPassword } = resetPasswordSchema.parse(req.body);
    const resetRequest = await prisma.passwordReset.findFirst({
      where: { email, token, consumed: false, expiresAt: { gt: new Date() } },
    });
    if (!resetRequest) {
      return next(badRequest('Invalid or expired reset code.'));
    }
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return next(badRequest('Customer not found.'));
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash },
    });
    await prisma.passwordReset.update({
      where: { id: resetRequest.id },
      data: { consumed: true },
    });
    res.json({ ok: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
});
