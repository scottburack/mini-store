import Link from "next/link";
import { getCart } from "../lib/cart";

export async function CartLink() {
  const { itemCount } = await getCart();

  return (
    <Link href="/cart" className="text-sm hover:underline">
      Cart{itemCount > 0 && ` (${itemCount})`}
    </Link>
  )
}