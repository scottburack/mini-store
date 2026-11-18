import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import type { CookieOptions, Request, Response } from 'express';
import { CART_COOKIE } from '../cart/cart.constants.js';
import { CartService } from '../cart/cart.service.js';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { JwtPayload } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly cookieOptions: CookieOptions;
  private readonly cookieMaxAgeMs: number;

  constructor(
    private readonly auth: AuthService,
    private readonly cart: CartService,
    config: ConfigService,
  ) {
    this.cookieMaxAgeMs = Number(config.getOrThrow('JWT_TTL_SECONDS')) * 1000;
    this.cookieOptions = {
      httpOnly: true,
      secure: config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto, 
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, token } = await this.auth.register(dto);
    res.cookie(AUTH_COOKIE, token, { ...this.cookieOptions, maxAge: this.cookieMaxAgeMs });
    await this.mergeGuestCart(user.id, req, res);
    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto, 
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, token, { ...this.cookieOptions, maxAge: this.cookieMaxAgeMs });
    await this.mergeGuestCart(user.id, req, res);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }

  /** If the request carries a guest cart cookie, fold it into the user's cart and clear the cookie. */
  private async mergeGuestCart(userId: string, req: Request, res: Response) {
    const raw: unknown = req.cookies?.[CART_COOKIE];
    if (typeof raw !== 'string' || !isUUID(raw)) return;
    try {
      await this.cart.mergeGuestCart(userId, raw);
      res.clearCookie(CART_COOKIE, this.cookieOptions);
    } catch (err) {
      // Login already succeeded; a failed merge shouldn't undo that.
      this.logger.error('Guest cart merge failed', err);
    }
  }

}
