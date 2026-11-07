import Link from "next/link";
import { Suspense } from "react";
import { ProductDetail } from "@/app/ui/product-detail";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← All products
      </Link>
      <Suspense fallback={<p className="mt-6 text-zinc-500">Loading product…</p>}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}
