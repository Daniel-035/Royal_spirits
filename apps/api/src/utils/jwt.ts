import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminTokenPayload {
  sub: string;
  role: 'admin';
  username: string;
}

export interface CustomerTokenPayload {
  sub: string;
  role: 'customer';
  phone: string;
}

const signOptions = { expiresIn: env.jwtExpiresIn } as jwt.SignOptions;

export function signAdminToken(payload: Omit<AdminTokenPayload, 'role'>): string {
  return jwt.sign({ ...payload, role: 'admin' }, env.jwtSecret, signOptions);
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'role'>): string {
  return jwt.sign({ ...payload, role: 'customer' }, env.jwtSecret, signOptions);
}

export function verifyToken(token: string): AdminTokenPayload | CustomerTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AdminTokenPayload | CustomerTokenPayload;
}

export function setAuthCookie(res: Response, name: string, token: string) {
  res.cookie(name, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    domain: env.cookieDomain,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response, name: string) {
  res.clearCookie(name, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    domain: env.cookieDomain,
    path: '/',
  });
}
