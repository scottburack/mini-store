import { 
  Controller,
  Get,
  Req, 
  Res,
  UseGuards,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
 } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import type { CookieOptions, Response } from 'express';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import type { MaybeAuthenticatedRequest } from '../auth/optional-jwt-auth.guard.js';
import { CART_COOKIE } from './cart.constants.js';
import { CartService } from './cart.service.js';
import type { CartOwner } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

const GUEST_CART_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  private readonly cookieOptions: CookieOptions;
  
  constructor(private readonly cart: CartService, config: ConfigService) {
    this.cookieOptions = {
      httpOnly: true,
      secure: config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: GUEST_CART_MAX_AGE_MS,
    }
  }

  @Get()
  getCart(@Req() req: MaybeAuthenticatedRequest) {
    return this.cart.getCart(this.owner(req));
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Req() req: MaybeAuthenticatedRequest,
    @Body() dto: AddCartItemDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const owner = this.owner(req);
    const { cartId, cart } = await this.cart.addItem(owner, dto);
    if (!owner.userId) res.cookie(CART_COOKIE, cartId, this.cookieOptions);
    return cart;
  }

  @Patch('items/:productId')
  updateItem(
    @Req() req: MaybeAuthenticatedRequest,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(this.owner(req), productId, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @Req() req: MaybeAuthenticatedRequest,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cart.removeItem(this.owner(req), productId);
  }

  private owner(req: MaybeAuthenticatedRequest): CartOwner {
    const raw: unknown = req.cookies?.[CART_COOKIE];
    return {
      userId: req.user?.sub,
      cartId: typeof raw === 'string' && isUUID(raw) ? raw : undefined,
    };
  }
}
