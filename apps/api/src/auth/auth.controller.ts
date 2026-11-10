import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  private readonly cookieMaxAgeMs: number;
  private readonly secureCookies: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.cookieMaxAgeMs = Number(config.getOrThrow('JWT_TTL_SECONDS')) * 1000;
    this.secureCookies = config.get('NODE_ENV') === 'production';
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    this.setAuthCookie(res, token);
    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    this.setAuthCookie(res, token);
    return user;
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: this.cookieMaxAgeMs,
    });
  }
}
