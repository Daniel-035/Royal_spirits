import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { requireAdmin } from '../middleware/requireAdmin';
import { signAdminToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { unauthorized, badRequest } from '../utils/errors';
import {
  adminLoginSchema,
  adminRegisterSchema,
  updateAdminProfileSchema,
} from '@royal-spirits/shared';

export const authRouter = Router();

authRouter.post('/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return next(unauthorized('Invalid credentials'));
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return next(unauthorized('Invalid credentials'));
    }
    const token = signAdminToken({ sub: admin.id, username: admin.username });
    setAuthCookie(res, env.adminCookieName, token);
    res.json({
      id: admin.id,
      username: admin.username,
      businessName: admin.businessName,
      licenseNumber: admin.licenseNumber,
      shopAddress: admin.shopAddress,
      phone: admin.phone,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/admin/me', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) {
      clearAuthCookie(res, env.adminCookieName);
      return next(unauthorized('Admin not found'));
    }
    res.json({
      id: admin.id,
      username: admin.username,
      businessName: admin.businessName,
      licenseNumber: admin.licenseNumber,
      shopAddress: admin.shopAddress,
      phone: admin.phone,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/admin/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res, env.adminCookieName);
  res.json({ ok: true });
});

authRouter.post('/admin/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, businessName, licenseNumber, shopAddress, phone } = adminRegisterSchema.parse(req.body);
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return next(badRequest('Username is already taken.'));
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { username, passwordHash, businessName, licenseNumber, shopAddress, phone },
    });
    const token = signAdminToken({ sub: admin.id, username: admin.username });
    setAuthCookie(res, env.adminCookieName, token);
    res.status(201).json({
      id: admin.id,
      username: admin.username,
      businessName: admin.businessName,
      licenseNumber: admin.licenseNumber,
      shopAddress: admin.shopAddress,
      phone: admin.phone,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.put('/admin/profile', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessName, licenseNumber, shopAddress, phone, currentPassword, newPassword } = updateAdminProfileSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) {
      return next(unauthorized('Admin not found'));
    }

    const updateData: any = {
      businessName,
      licenseNumber,
      shopAddress,
      phone,
    };

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return next(badRequest('Current password is required to set a new password.'));
      }
      const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!ok) {
        return next(badRequest('Invalid current password.'));
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      username: updated.username,
      businessName: updated.businessName,
      licenseNumber: updated.licenseNumber,
      shopAddress: updated.shopAddress,
      phone: updated.phone,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/admin/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.body;
    if (!username) {
      return next(badRequest('Username is required.'));
    }
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      res.json({ message: 'If the username exists, a reset code has been sent.' });
      return;
    }
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordReset.create({
      data: { email: username, token, expiresAt },
    });
    console.log(`[MOCK ADMIN PASSWORD RESET] username=${username} code=${token}`);
    res.json({ message: 'If the username exists, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/admin/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, token, newPassword } = req.body;
    if (!username || !token || !newPassword) {
      return next(badRequest('Username, token and new password are required.'));
    }
    const resetRequest = await prisma.passwordReset.findFirst({
      where: { email: username, token, consumed: false, expiresAt: { gt: new Date() } },
    });
    if (!resetRequest) {
      return next(badRequest('Invalid or expired reset code.'));
    }
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return next(badRequest('Admin not found.'));
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
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
