import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyToken, type CustomerTokenPayload } from '../utils/jwt';
import { unauthorized } from '../utils/errors';

export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.customerCookieName];
  if (!token) {
    return next(unauthorized('Customer session required'));
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'customer') {
      return next(unauthorized('Invalid session role'));
    }
    req.customer = payload as CustomerTokenPayload;
    next();
  } catch {
    return next(unauthorized('Invalid or expired session'));
  }
}
