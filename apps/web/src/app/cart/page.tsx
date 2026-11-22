import { Suspense } from "react";
import { CartView } from "@/app/ui/cart-view";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <Suspense fallback={<p className="mt-8 text-zinc-500">Loading cart…</p>}>
        <CartView />
      </Suspense>
    </main>
  );
}
