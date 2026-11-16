import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from 'express';
import type { JwtPayload } from './auth.service.js';
import { readUser } from './read-user.js';

export type MaybeAuthenticatedRequest = Request & { user?: JwtPayload };

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<MaybeAuthenticatedRequest>();
    req.user = (await readUser(req, this.jwt)) ?? undefined;
    return true;
  }
}