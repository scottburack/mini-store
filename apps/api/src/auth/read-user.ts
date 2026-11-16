import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_COOKIE } from './auth.constants.js';
import type { JwtPayload } from './auth.service.js';

/** Returns the verified JWT payload from the auth cookie, or null if missing/invalid/expired. */
export async function readUser(req: Request, jwt: JwtService): Promise<JwtPayload | null> {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  if (typeof token !== 'string' || token.length === 0) return null;
  try {
    return await jwt.verifyAsync<JwtPayload>(token);
  } catch {
    return null;
  }
}
