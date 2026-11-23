"use server";

import { refresh } from "next/cache";
import { nestFetch, relayCookies } from "./nest";

export type AddToCartState = { error?: string; added?: boolean};

export async function addToCart(
  _prev: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const productId = String(formData.get("productId") ?? "");

  const res = await nestFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  if (!res.ok) return { error: await cartError(res) }

  // A guest's first add creates the cart: Nest sends cart_id, we pass it to the browser.
  await relayCookies(res);
  refresh(); // header count + current page re-render
  return { added: true };
}

async function cartError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string | string[]} | null;
  const message = Array.isArray(body?.message) ? body.message.join(". ") : body?.message;
  return message ?? "Coudln't add to cart. Please try again.";
}

export async function updateCartItem(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity"));

  const res = await nestFetch(`/cart/items/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error(`Couldn't update cart (${res.status})`);

  refresh(); // re-render the current page with the new cart
}

export async function removeCartItem(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");

  const res = await nestFetch(`/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE"
  })
  if (!res.ok) throw new Error(`Couldn't remove item (${res.status})`)
  
  refresh();
}