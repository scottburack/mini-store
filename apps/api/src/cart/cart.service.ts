import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const cartSelect = {
  id: true,
  items: {
    orderBy: { createdAt: 'asc' },
    select: {
      quantity: true,
      product: {
        select: { id: true, name: true, priceCents: true, imageUrl: true, stock: true },
      },
    },
  },
} satisfies Prisma.CartSelect;

type CartRow = Prisma.CartGetPayload<{ select: typeof cartSelect }>;

/** Who the cart belongs to: a logged-in user, or a guest identified by the cart cookie. */
export type CartOwner = { userId?: string; cartId?: string };

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(owner: CartOwner) {
    return toCartView(await this.findCart(owner));
  }

  private async findCart({ userId, cartId }: CartOwner): Promise<CartRow | null> {
    if (userId) {
      return this.prisma.cart.findUnique({ where: { userId }, select: cartSelect });
    }
    if (cartId) {
      // userId: null → a guest cookie can only ever open a guest cart, never a user's.
      return this.prisma.cart.findFirst({ where: { id: cartId, userId: null }, select: cartSelect });
    }
    return null;
  }
}

function toCartView(cart: CartRow | null) {
  const items = (cart?.items ?? []).map(({ quantity, product }) => ({
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    unitPriceCents: product.priceCents,
    quantity,
    lineTotalCents: product.priceCents * quantity,
    stock: product.stock,
  }));

  return {
    id: cart?.id ?? null,
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}
