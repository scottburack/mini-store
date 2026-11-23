"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addToCart, type AddToCartState } from "../lib/cart-actions";

type Props = { productId: string; soldOut: boolean };

export function AddToCartButton({ productId, soldOut}: Props) {
  const [state, formAction, pending] = useActionState<AddToCartState, FormData>(addToCart, {});

  return (
    <form action={formAction} className="mt-6 flex flex-col items-start gap-2">
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={soldOut || pending}
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-white disabled:opacity-50"
      >
        {soldOut ? "Sold out" : pending ? "Adding..." : "Add to cart"}
      </button>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.added && !state.error && (
        <p className="text-sm text-green-700">
          Added to cart.{" "}
          <Link href="/cart" className="underline">
            View cart
          </Link>
        </p>
      )}
    </form>
  )
}