import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/app/lib/api";
import { formatPrice } from "@/app/lib/format";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function ProductGrid({ searchParams }: Props) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(Array.isArray(page) ? page[0] : page) || 1);
  const { items, totalPages } = await getProducts(current);

  if (items.length === 0) {
    return <p className="text-zinc-500">No products found.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((product) => (
          <li key={product.id}>
            <Link href={`/products/${product.id}`} className="group block">
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="aspect-square w-full rounded-lg bg-zinc-100 object-cover"
                />
              )}
              <h2 className="mt-3 font-medium group-hover:underline">{product.name}</h2>
              <p className="text-zinc-600">{formatPrice(product.priceCents)}</p>
              {product.stock === 0 && <p className="text-sm text-red-600">Sold out</p>}
            </Link>
          </li>
        ))}
      </ul>

      <nav className="mt-10 flex items-center justify-between text-sm">
        {current > 1 ? <Link href={`/?page=${current - 1}`}>← Previous</Link> : <span />}
        <span className="text-zinc-500">
          Page {current} of {totalPages}
        </span>
        {current < totalPages ? <Link href={`/?page=${current + 1}`}>Next →</Link> : <span />}
      </nav>
    </>
  );
}