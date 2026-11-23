import Image from "next/image";
import Link from "next/link";
import { getCart } from "@/app/lib/cart";
import { removeCartItem, updateCartItem } from "@/app/lib/cart-actions";
import { formatPrice } from "@/app/lib/format";

export async function CartView() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-zinc-500">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 py-4">
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-md bg-zinc-100 object-cover"
              />
            )}

            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.productId}`} className="font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-zinc-500">{formatPrice(item.unitPriceCents)} each</p>
            </div>

            {/* One form, two submit buttons: the clicked button's value is what gets sent. */}
            <form action={updateCartItem} className="flex items-center gap-2">
              <input type="hidden" name="productId" value={item.productId} />
              <button
                name="quantity"
                value={item.quantity - 1}
                disabled={item.quantity <= 1}
                aria-label={`Decrease ${item.name}`}
                className="h-8 w-8 rounded-md border border-zinc-300 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center tabular-nums">{item.quantity}</span>
              <button
                name="quantity"
                value={item.quantity + 1}
                disabled={item.quantity >= Math.min(item.stock, 99)}
                aria-label={`Increase ${item.name}`}
                className="h-8 w-8 rounded-md border border-zinc-300 disabled:opacity-40"
              >
                +
              </button>
            </form>

            <p className="w-20 text-right tabular-nums">{formatPrice(item.lineTotalCents)}</p>

            <form action={removeCartItem}>
              <input type="hidden" name="productId" value={item.productId} />
              <button className="text-sm text-zinc-500 hover:text-red-600 hover:underline">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg">
          Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}):{" "}
          <span className="font-semibold">{formatPrice(cart.subtotalCents)}</span>
        </p>
        <button
          disabled
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
          title="Checkout arrives in Slice 4"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
