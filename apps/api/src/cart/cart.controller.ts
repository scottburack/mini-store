import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import type { MaybeAuthenticatedRequest } from '../auth/optional-jwt-auth.guard.js';
import { CART_COOKIE } from './cart.constants.js';
import { CartService } from './cart.service.js';
import type { CartOwner } from './cart.service.js';

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@Req() req: MaybeAuthenticatedRequest) {
    return this.cart.getCart(this.owner(req));
  }

  private owner(req: MaybeAuthenticatedRequest): CartOwner {
    const raw: unknown = req.cookies?.[CART_COOKIE];
    return {
      userId: req.user?.sub,
      cartId: typeof raw === 'string' && isUUID(raw) ? raw : undefined,
    };
  }
}
