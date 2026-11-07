import Image from "next/image";
import { getProduct } from "@/app/lib/api";
import { formatPrice } from "@/app/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

export async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <article className="mt-6 grid gap-10 md:grid-cols-2">
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={600}
          className="aspect-square w-full rounded-lg bg-zinc-100 object-cover"
        />
      )}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-xl">{formatPrice(product.priceCents)}</p>
        <p className="mt-6 text-zinc-600">{product.description}</p>
        <p className="mt-6 text-sm text-zinc-500">
          {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
        </p>
        {/* Add-to-cart button arrives in Slice 3 */}
      </div>
    </article>
  );
}
