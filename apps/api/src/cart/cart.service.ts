import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';

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

const MAX_LINE_QUANTITY = 99;

type CartRow = Prisma.CartGetPayload<{ select: typeof cartSelect }>;

/** Who the cart belongs to: a logged-in user, or a guest identified by the cart cookie. */
export type CartOwner = { userId?: string; cartId?: string };

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(owner: CartOwner) {
    const where = cartWhere(owner);
    const cart = where
      ? await this.prisma.cart.findFirst({ where, select: cartSelect })
      : null;
    return toCartView(cart);
  }

  /** Adds (or increments) a product. Creates the cart on first add; returns its id so a guest cookie can be set. */
  async addItem(owner: CartOwner, { productId, quantity }: AddCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { stock: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const cartId = await this.findOrCreateCartId(owner);
    const key = { cartId_productId: { cartId, productId } };

    const existing = await this.prisma.cartItem.findUnique({ where: key, select: { quantity: true } });
    assertInStock((existing?.quantity ?? 0) + quantity, product.stock);

    await this.prisma.cartItem.upsert({
      where: key,
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return { cartId, cart: await this.getCart({ ...owner, cartId }) };
  }

  async updateItem(owner: CartOwner, productId: string, quantity: number) {
    const cartId = await this.findCartId(owner);
    const key = { cartId_productId: { cartId: cartId ?? '', productId } };

    const item = cartId
      ? await this.prisma.cartItem.findUnique({
          where: key,
          select: { product: { select: { stock: true } } },
        })
      : null;
    if (!item) throw new NotFoundException('Item not in cart');

    assertInStock(quantity, item.product.stock);
    await this.prisma.cartItem.update({ where: key, data: { quantity } });
    return this.getCart(owner);
  }

  async removeItem(owner: CartOwner, productId: string) {
    const cartId = await this.findCartId(owner);
    if (cartId) {
      await this.prisma.cartItem.deleteMany({ where: { cartId, productId } });
    }
    return this.getCart(owner);
  }

    /** Moves a guest cart's items into the user's cart, then deletes the guest cart. */
  async mergeGuestCart(userId: string, guestCartId: string) {
    await this.prisma.$transaction(async (tx) => {
      const guest = await tx.cart.findFirst({
        where: { id: guestCartId, userId: null },
        select: {
          id: true,
          items: {
            select: { productId: true, quantity: true, product: { select: { stock: true } } },
          },
        },
      });
      if (!guest) return;

      const userCart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });

      for (const item of guest.items) {
        const key = { cartId_productId: { cartId: userCart.id, productId: item.productId } };
        const existing = await tx.cartItem.findUnique({ where: key, select: { quantity: true } });
        const quantity = Math.min(
          (existing?.quantity ?? 0) + item.quantity,
          item.product.stock,
          MAX_LINE_QUANTITY,
        );
        if (quantity < 1) continue; // out of stock now: drop it

        await tx.cartItem.upsert({
          where: key,
          create: { cartId: userCart.id, productId: item.productId, quantity },
          update: { quantity },
        });
      }

      // Cascade deletes the guest cart's items too.
      await tx.cart.delete({ where: { id: guest.id } });
    });
  }

  private async findCartId(owner: CartOwner): Promise<string | null> {
    const where = cartWhere(owner);
    if (!where) return null;
    const cart = await this.prisma.cart.findFirst({ where, select: { id: true } });
    return cart?.id ?? null;
  }

  private async findOrCreateCartId(owner: CartOwner): Promise<string> {
    if (owner.userId) {
      const cart = await this.prisma.cart.upsert({
        where: { userId: owner.userId },
        create: { userId: owner.userId },
        update: {},
        select: { id: true },
      });
      return cart.id;
    }
    const existing = await this.findCartId(owner);
    if (existing) return existing;
    const cart = await this.prisma.cart.create({ data: {}, select: { id: true } });
    return cart.id;
  }
}

/** Logged-in users own their cart by userId; guests only ever reach carts with no user. */
function cartWhere({ userId, cartId }: CartOwner): Prisma.CartWhereInput | null {
  if (userId) return { userId };
  if (cartId) return { id: cartId, userId: null };
  return null;
}

function assertInStock(quantity: number, stock: number) {
  if (quantity > stock) {
    throw new BadRequestException(`Only ${stock} left in stock`);
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
