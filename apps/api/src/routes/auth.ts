import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { requireAdmin } from '../middleware/requireAdmin';
import { signAdminToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { unauthorized } from '../utils/errors';
import { adminLoginSchema } from '@royal-spirits/shared';

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
    res.json({ id: admin.id, username: admin.username });
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
    res.json({ id: admin.id, username: admin.username });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/admin/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res, env.adminCookieName);
  res.json({ ok: true });
});
