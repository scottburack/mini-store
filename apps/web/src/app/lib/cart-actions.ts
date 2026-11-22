"use server";

import { refresh } from "next/cache";
import { nestFetch } from "./nest";

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