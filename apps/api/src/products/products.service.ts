import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';

const productSelect = {
  id: true,
  sku: true,
  name: true,
  description: true,
  priceCents: true,
  stock: true,
  imageUrl: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page, pageSize }: ListProductsQueryDto) {
    const where = { active: true } satisfies Prisma.ProductWhereInput;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, active: true },
      select: productSelect,
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }
}
