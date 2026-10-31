import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
});

const img = (text: string) =>
  `https://placehold.co/600x600/png?text=${encodeURIComponent(text)}`;

const products = [
  { sku: 'MUG-001', name: 'Ceramic Mug', description: 'A 12oz stoneware mug with a matte glaze.', priceCents: 1800, stock: 40 },
  { sku: 'TEE-001', name: 'Everyday Tee', description: 'Heavyweight cotton t-shirt, boxy fit.', priceCents: 3200, stock: 25 },
  { sku: 'CAP-001', name: 'Canvas Cap', description: 'Six-panel cap with an adjustable strap.', priceCents: 2800, stock: 15 },
  { sku: 'BAG-001', name: 'Tote Bag', description: 'Heavy canvas tote with an inner pocket.', priceCents: 2400, stock: 30 },
  { sku: 'NTB-001', name: 'Dot Grid Notebook', description: 'A5, 120gsm paper, lay-flat binding.', priceCents: 1600, stock: 60 },
  { sku: 'PEN-001', name: 'Brass Pen', description: 'Solid brass ballpoint that ages nicely.', priceCents: 4500, stock: 10 },
  { sku: 'BTL-001', name: 'Steel Bottle', description: 'Insulated 750ml bottle, keeps drinks cold for 24h.', priceCents: 3500, stock: 20 },
  { sku: 'SCK-001', name: 'Wool Socks', description: 'Merino blend crew socks.', priceCents: 1400, stock: 50 },
  { sku: 'HOD-001', name: 'Fleece Hoodie', description: 'Brushed fleece pullover hoodie.', priceCents: 6800, stock: 12 },
  { sku: 'CND-001', name: 'Soy Candle', description: 'Cedar and smoke, 40 hour burn time.', priceCents: 2200, stock: 18 },
  { sku: 'PST-001', name: 'Art Print', description: 'A3 giclee print on archival paper.', priceCents: 3000, stock: 8 },
  { sku: 'LST-001', name: 'Last One Lamp', description: 'Only one left. Good for testing oversell.', priceCents: 9900, stock: 1 },
].map((p) => ({ ...p, imageUrl: img(p.name) }));

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      create: product,
      update: product,
    });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
