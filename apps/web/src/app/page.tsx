import { Suspense } from "react";
import { ProductGrid } from "@/app/ui/product-grid";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Products</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading products…</p>}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
