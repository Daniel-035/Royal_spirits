import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyToken, type AdminTokenPayload } from '../utils/jwt';
import { unauthorized } from '../utils/errors';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.adminCookieName];
  if (!token) {
    return next(unauthorized('Admin session required'));
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return next(unauthorized('Invalid session role'));
    }
    req.admin = payload as AdminTokenPayload;
    next();
  } catch {
    return next(unauthorized('Invalid or expired session'));
  }
}
